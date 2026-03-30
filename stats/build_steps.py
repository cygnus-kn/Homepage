import json
import sqlite3

db_path = "/Users/cygnus/Documents/GitHub/Homepage/stats/health_connect_export.db"
out_path = "/Users/cygnus/Documents/GitHub/Homepage/stats/steps_data.js"

conn = sqlite3.connect(db_path)
c = conn.cursor()
c.execute("""
    SELECT 
        date(end_time/1000, 'unixepoch', 'localtime'), 
        sum(count)
    FROM steps_record_table 
    GROUP BY date(end_time/1000, 'unixepoch', 'localtime')
""")

data = {}
for row in c.fetchall():
    date_str, count = row
    if date_str:
        data[date_str] = count

js_content = f"const stepsData = {json.dumps(data, indent=2)};"
with open(out_path, "w") as f:
    f.write(js_content)

print(f"Generated {out_path} with {len(data)} days of steps data.")
