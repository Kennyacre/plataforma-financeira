import os
import subprocess
import datetime

def run_backup():
    try:
        date_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_name = f"BACKUP_MTConnect_V2_{date_str}.tar.gz"
        backup_path = f"/DATA/AppData/MTConnect_V2/{backup_name}"
        
        # 1. DB Dump
        print("Starting DB Dump...")
        db_dump_path = "/tmp/db_dump.sql"
        res = subprocess.run(["docker", "exec", "db_postgres", "pg_dump", "-U", "postgres", "TN_INFO_DATABASE"], capture_output=True, text=True)
        if res.returncode == 0:
            with open(db_dump_path, "w") as f:
                f.write(res.stdout)
            print("DB Dump Success")
        else:
            print(f"DB Dump Failed: {res.stderr}")
            db_dump_path = None

        # 2. Tar
        print("Starting Tar...")
        cmd = ["tar", "-czf", backup_path, "-C", "/DATA/AppData/MTConnect_V2", "."]
        if db_dump_path:
            # Add the dump to the tar if possible, but easier to just tar the whole dir and then maybe the dump separately or move dump to dir
            # Let's move dump to the dir first
            subprocess.run(["mv", db_dump_path, "/DATA/AppData/MTConnect_V2/database_dump.sql"])
        
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode == 0:
            print(f"Tar Success: {backup_path}")
        else:
            print(f"Tar Failed: {res.stderr}")

        # Cleanup dump file if it was moved
        if db_dump_path:
            subprocess.run(["rm", "/DATA/AppData/MTConnect_V2/database_dump.sql"])

    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    run_backup()
