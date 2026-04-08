"""
Shared database connection helper.
Reads the INTEX_SQL_CONNECTION environment variable (set as a GitHub Secret).

Expected format (copy from Azure Portal → your SQL DB → Connection strings → ODBC):
  Driver={ODBC Driver 18 for SQL Server};Server=tcp:YOUR_SERVER.database.windows.net,1433;
  Database=YOUR_DB;Uid=YOUR_USER;Pwd=YOUR_PASSWORD;Encrypt=yes;TrustServerCertificate=no;
  Connection Timeout=30;
"""
import os
import sqlalchemy


def get_engine() -> sqlalchemy.Engine:
    odbc = os.environ.get("INTEX_SQL_CONNECTION")
    if not odbc:
        raise EnvironmentError(
            "INTEX_SQL_CONNECTION environment variable is not set. "
            "Add it as a GitHub Secret named INTEX_SQL_CONNECTION."
        )
    url = sqlalchemy.engine.URL.create(
        "mssql+pyodbc",
        query={"odbc_connect": odbc},
    )
    return sqlalchemy.create_engine(url, fast_executemany=True)
