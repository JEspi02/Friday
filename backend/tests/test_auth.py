import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from core.auth import get_current_user

def test_get_current_user_invalid_token():
    # Arrange
    invalid_credentials = HTTPAuthorizationCredentials(
        scheme="Bearer",
        credentials="invalid.jwt.token.here"
    )

    # Act & Assert
    with pytest.raises(HTTPException) as exc_info:
        get_current_user(invalid_credentials)

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Could not validate credentials"
