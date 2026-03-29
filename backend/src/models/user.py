from sqlmodel import SQLModel, Field


class User(SQLModel, table=True):
    __tablename__ = "users"  # type: ignore

    id: int | None = Field(default=None, primary_key=True)
    username: str = Field(index=True, nullable=False, unique=True)
    email: str = Field(index=True, nullable=False, unique=True)
    hashed_password: str = Field(nullable=False)

