import bcrypt

from api.security import hash_password, verify_password


def test_hash_and_verify_password_roundtrip():
    password = "securepass123"

    hashed = hash_password(password)

    assert hashed.startswith("$2")
    assert verify_password(password, hashed)
    assert not verify_password("wrong-password", hashed)


def test_verify_legacy_bcrypt_hash_compatible():
    # Simulate legacy stack behavior where bcrypt effectively used first 72 bytes.
    long_password = "a" * 80
    legacy_hash = bcrypt.hashpw(long_password.encode("utf-8")[:72], bcrypt.gensalt(rounds=12)).decode("utf-8")

    assert verify_password(long_password, legacy_hash)


def test_long_passwords_supported_with_consistent_truncation():
    long_password = "密码" * 50  # >72 UTF-8 bytes

    hashed = hash_password(long_password)

    assert verify_password(long_password, hashed)
