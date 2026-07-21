import os
from datetime import datetime
from sqlalchemy import (create_engine, Column, Integer, String, Text,
                        DateTime, ForeignKey)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

from werkzeug.security import generate_password_hash, check_password_hash

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///legalease.db")

engine = create_engine(DATABASE_URL, echo=False, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    username = Column(String(128), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    filename = Column(String(255), nullable=True)
    raw_text = Column(Text, nullable=True)
    analyses = relationship("Analysis", back_populates="document")


class Analysis(Base):
    __tablename__ = "analyses"
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    language = Column(String(64), nullable=False)
    summary_text = Column(Text, nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    document = relationship("Document", back_populates="analyses")


def init_db():
    Base.metadata.create_all(bind=engine)


def create_user(username: str, email: str, password: str, full_name: str | None = None):
    session = SessionLocal()
    try:
        if session.query(User).filter((User.username == username) | (User.email == email)).first():
            return None, "Username or email already registered"
        user = User(username=username, email=email, full_name=full_name or username)
        user.set_password(password)
        session.add(user)
        session.commit()
        return {"id": user.id, "username": user.username, "email": user.email, "full_name": user.full_name}, None
    except Exception as e:
        session.rollback()
        return None, str(e)
    finally:
        session.close()


def authenticate_user(username_or_email: str, password: str):
    session = SessionLocal()
    try:
        user = session.query(User).filter(
            (User.username == username_or_email) | (User.email == username_or_email)
        ).first()
        if user and user.check_password(password):
            return {"id": user.id, "username": user.username, "email": user.email, "full_name": user.full_name}, None
        return None, "Invalid username/email or password"
    except Exception as e:
        return None, str(e)
    finally:
        session.close()


def get_user_by_id(user_id: int):
    session = SessionLocal()
    try:
        user = session.query(User).filter(User.id == user_id).first()
        if user:
            return {"id": user.id, "username": user.username, "email": user.email, "full_name": user.full_name}
        return None
    finally:
        session.close()


def save_transaction_to_db(language: str, full_response_text: str, *,
                           document_filename: str | None = None,
                           raw_text: str | None = None) -> None:
    """Persist an analysis transaction and optional source document.

    This function is safe to call from the Flask apps. It will create the
    database file/tables automatically when running in development.
    """
    session = SessionLocal()
    try:
        doc = None
        if raw_text or document_filename:
            doc = Document(filename=document_filename, raw_text=(raw_text or None))
            session.add(doc)
            session.flush()  # populate doc.id

        analysis = Analysis(language=language, summary_text=full_response_text,
                            document_id=(doc.id if doc else None))
        session.add(analysis)
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

