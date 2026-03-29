import json
import sqlite3

db_path = "/Users/cygnus/Documents/GitHub/heatmap-website/health_connect_export.db"
out_path = "/Users/cygnus/Documents/GitHub/Homepage/stats/sleep_data.js"

conn = sqlite3.connect(db_path)
c = conn.cursor()
c.execute("""
    SELECT 
        date(end_time/1000, 'unixepoch', 'localtime'), 
        round(sum((end_time - start_time) / 3600000.0), 2)
    FROM sleep_session_record_table 
    GROUP BY date(end_time/1000, 'unixepoch', 'localtime')
""")

data = {}
for row in c.fetchall():
    date_str, duration = row
    if date_str:
        data[date_str] = duration

js_content = f"const sleepData = {json.dumps(data, indent=2)};"
with open(out_path, "w") as f:
    f.write(js_content)

print(f"Generated {out_path} with {len(data)} days of sleep data.")
