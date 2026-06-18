import os
from datetime import datetime
from sqlalchemy import (create_engine, Column, Integer, String, Text,
                        DateTime, ForeignKey)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///legalease.db")

engine = create_engine(DATABASE_URL, echo=False, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


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
