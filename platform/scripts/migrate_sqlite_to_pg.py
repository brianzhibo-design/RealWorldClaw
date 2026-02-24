#!/usr/bin/env python3
"""
SQLite到PostgreSQL迁移脚本
将现有SQLite数据库完整迁移到PostgreSQL
"""

import os
import sys
import sqlite3
import json
from pathlib import Path
from typing import List, Dict, Any

# 添加父目录到路径以便导入
sys.path.append(str(Path(__file__).parent.parent))

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    print("❌ 请安装psycopg2: pip install psycopg2-binary")
    sys.exit(1)

from api.database import DB_PATH
from api.database_pg import init_db

def get_sqlite_tables(sqlite_path: Path) -> List[str]:
    """获取SQLite数据库中的所有用户表"""
    conn = sqlite3.connect(str(sqlite_path))
    cursor = conn.cursor()
    cursor.execute("""
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
    """)
    tables = [row[0] for row in cursor.fetchall()]
    conn.close()
    return tables


def get_table_schema(sqlite_path: Path, table_name: str) -> List[Dict[str, Any]]:
    """获取表的schema信息"""
    conn = sqlite3.connect(str(sqlite_path))
    cursor = conn.cursor()
    cursor.execute(f"PRAGMA table_info({table_name})")
    schema = cursor.fetchall()
    conn.close()
    
    # 转换为更友好的格式
    columns = []
    for col in schema:
        columns.append({
            'name': col[1],
            'type': col[2],
            'notnull': bool(col[3]),
            'default_value': col[4],
            'pk': bool(col[5])
        })
    
    return columns


def count_table_rows(conn, table_name: str, is_postgres: bool = False) -> int:
    """计算表中的行数"""
    if is_postgres:
        cursor = conn.cursor()
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        return cursor.fetchone()[0]
    else:
        cursor = conn.execute(f"SELECT COUNT(*) FROM {table_name}")
        return cursor.fetchone()[0]


def export_table_data(sqlite_path: Path, table_name: str) -> List[Dict[str, Any]]:
    """从SQLite表中导出所有数据"""
    conn = sqlite3.connect(str(sqlite_path))
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute(f"SELECT * FROM {table_name}")
    rows = cursor.fetchall()
    
    # 转换为字典列表
    data = []
    for row in rows:
        data.append(dict(row))
    
    conn.close()
    return data


def insert_table_data(pg_conn, table_name: str, columns: List[Dict[str, Any]], data: List[Dict[str, Any]]) -> int:
    """将数据插入PostgreSQL表"""
    if not data:
        return 0
    
    # 构建INSERT语句
    column_names = [col['name'] for col in columns]
    placeholders = ', '.join(['%s'] * len(column_names))
    insert_sql = f"INSERT INTO {table_name} ({', '.join(column_names)}) VALUES ({placeholders})"
    
    cursor = pg_conn.cursor()
    inserted_count = 0
    
    for row in data:
        try:
            # 按照schema顺序构建values
            values = []
            for col in columns:
                col_name = col['name']
                value = row.get(col_name)
                
                # 处理特殊类型转换
                if value is not None:
                    # JSON字段保持原样
                    if col_name in ['tags', 'capabilities', 'hardware_inventory', 'materials', 'parameters', 'hardware_available', 'wishlist']:
                        # 确保JSON字段是有效的JSON字符串
                        if isinstance(value, str) and value.strip():
                            try:
                                json.loads(value)  # 验证JSON
                            except json.JSONDecodeError:
                                value = '[]'  # 默认空数组
                        elif not value:
                            value = '[]'
                    
                    # TIMESTAMP字段转换
                    if 'created_at' in col_name or 'updated_at' in col_name or '_at' in col_name:
                        # SQLite中的时间戳可能是字符串，PostgreSQL需要正确格式
                        if isinstance(value, str) and value:
                            # 基本时间格式转换
                            pass  # PostgreSQL通常能自动处理ISO格式
                
                values.append(value)
            
            cursor.execute(insert_sql, values)
            inserted_count += 1
            
        except Exception as e:
            print(f"  ⚠️  插入行失败 {table_name}: {e}")
            print(f"     行数据: {row}")
            continue
    
    return inserted_count


def migrate_database(sqlite_path: Path, postgres_url: str):
    """执行完整的数据库迁移"""
    print("🚀 开始迁移数据库...")
    print(f"   源数据库: {sqlite_path}")
    print(f"   目标数据库: {postgres_url[:50]}...")
    
    # 检查SQLite文件是否存在
    if not sqlite_path.exists():
        print(f"❌ SQLite数据库文件不存在: {sqlite_path}")
        return False
    
    # 获取SQLite中的表
    tables = get_sqlite_tables(sqlite_path)
    print(f"📊 发现 {len(tables)} 个表: {', '.join(tables)}")
    
    if not tables:
        print("⚠️  没有找到可迁移的表")
        return False
    
    # 连接PostgreSQL
    try:
        pg_conn = psycopg2.connect(postgres_url)
        pg_conn.autocommit = False
        print("✅ 已连接到PostgreSQL")
    except Exception as e:
        print(f"❌ 无法连接PostgreSQL: {e}")
        return False
    
    try:
        # 初始化PostgreSQL数据库结构
        print("🏗️  初始化PostgreSQL数据库结构...")
        
        # 设置环境变量以使用PostgreSQL
        os.environ['DATABASE_URL'] = postgres_url
        
        # 导入并初始化数据库
        init_db()
        print("✅ PostgreSQL数据库结构已初始化")
        
        # 记录迁移统计
        migration_stats = {}
        total_rows_migrated = 0
        
        # 逐表迁移数据
        for table_name in tables:
            print(f"\n📦 迁移表: {table_name}")
            
            try:
                # 获取表schema和数据
                schema = get_table_schema(sqlite_path, table_name)
                sqlite_count = count_table_rows(sqlite3.connect(str(sqlite_path)), table_name)
                print(f"   SQLite行数: {sqlite_count}")
                
                if sqlite_count == 0:
                    print(f"   ⏭️  表 {table_name} 为空，跳过")
                    migration_stats[table_name] = {'sqlite': 0, 'postgres': 0, 'status': 'empty'}
                    continue
                
                # 导出数据
                data = export_table_data(sqlite_path, table_name)
                print(f"   📤 导出 {len(data)} 行数据")
                
                # 插入数据
                inserted_count = insert_table_data(pg_conn, table_name, schema, data)
                print(f"   📥 插入 {inserted_count} 行数据")
                
                # 验证迁移
                pg_count = count_table_rows(pg_conn, table_name, is_postgres=True)
                print(f"   PostgreSQL行数: {pg_count}")
                
                if pg_count == sqlite_count:
                    print(f"   ✅ 表 {table_name} 迁移成功")
                    status = 'success'
                else:
                    print(f"   ⚠️  表 {table_name} 行数不匹配 (SQLite: {sqlite_count}, PostgreSQL: {pg_count})")
                    status = 'partial'
                
                migration_stats[table_name] = {
                    'sqlite': sqlite_count,
                    'postgres': pg_count,
                    'status': status
                }
                
                total_rows_migrated += inserted_count
                
                # 提交这个表的更改
                pg_conn.commit()
                
            except Exception as e:
                print(f"   ❌ 表 {table_name} 迁移失败: {e}")
                migration_stats[table_name] = {'sqlite': 0, 'postgres': 0, 'status': 'failed', 'error': str(e)}
                pg_conn.rollback()
                continue
        
        # 最终统计
        print("\n📊 迁移完成统计:")
        print(f"   总共迁移 {total_rows_migrated} 行数据")
        
        success_count = sum(1 for stats in migration_stats.values() if stats['status'] == 'success')
        partial_count = sum(1 for stats in migration_stats.values() if stats['status'] == 'partial')
        failed_count = sum(1 for stats in migration_stats.values() if stats['status'] == 'failed')
        empty_count = sum(1 for stats in migration_stats.values() if stats['status'] == 'empty')
        
        print(f"   成功: {success_count} 表")
        print(f"   部分: {partial_count} 表")
        print(f"   失败: {failed_count} 表")
        print(f"   空表: {empty_count} 表")
        
        # 详细报告
        print("\n📋 详细报告:")
        for table_name, stats in migration_stats.items():
            status_emoji = {'success': '✅', 'partial': '⚠️', 'failed': '❌', 'empty': '⏭️'}
            emoji = status_emoji.get(stats['status'], '❓')
            print(f"   {emoji} {table_name}: {stats['sqlite']} -> {stats['postgres']} ({stats['status']})")
            if 'error' in stats:
                print(f"      错误: {stats['error']}")
        
        return success_count + partial_count > 0
        
    except Exception as e:
        print(f"❌ 迁移过程中发生错误: {e}")
        pg_conn.rollback()
        return False
        
    finally:
        pg_conn.close()


def main():
    """主函数"""
    # 检查环境变量
    postgres_url = os.getenv('DATABASE_URL')
    if not postgres_url:
        print("❌ 请设置环境变量 DATABASE_URL")
        print("   例如: export DATABASE_URL='postgresql://user:pass@localhost:5432/dbname'")
        sys.exit(1)
    
    # SQLite数据库路径
    sqlite_path = DB_PATH
    
    if len(sys.argv) > 1:
        sqlite_path = Path(sys.argv[1])
    
    print("SQLite到PostgreSQL迁移工具")
    print("================================")
    
    # 询问确认
    response = input(f"确定要将 {sqlite_path} 迁移到PostgreSQL吗? (y/N): ").strip().lower()
    if response not in ['y', 'yes']:
        print("❌ 用户取消迁移")
        return
    
    # 执行迁移
    success = migrate_database(sqlite_path, postgres_url)
    
    if success:
        print("\n🎉 数据库迁移成功完成!")
        print("💡 建议:")
        print("   1. 验证应用功能正常")
        print("   2. 备份原SQLite文件")
        print("   3. 更新生产环境配置")
    else:
        print("\n💥 数据库迁移失败!")
        print("💡 建议:")
        print("   1. 检查错误信息")
        print("   2. 确保PostgreSQL可访问")
        print("   3. 验证SQLite文件完整")


if __name__ == "__main__":
    main()