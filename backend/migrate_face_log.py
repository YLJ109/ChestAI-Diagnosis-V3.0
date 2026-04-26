"""
人脸识别数据库迁移脚本
添加 face_recognition_logs 表
"""
import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'data', 'aixray.db')


def migrate():
    """执行数据库迁移"""
    try:
        print("[迁移] 开始创建人脸识别日志表...")

        if not os.path.exists(db_path):
            print(f"[迁移] ❌ 数据库文件不存在: {db_path}")
            return False

        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # 检查表是否已存在
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='face_recognition_logs'")
        if cursor.fetchone():
            print("[迁移] ⚠️ face_recognition_logs 表已存在,跳过")
            conn.close()
            return True

        # 创建人脸识别日志表
        cursor.execute("""
            CREATE TABLE face_recognition_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                recognition_type VARCHAR(20) NOT NULL,
                target_id INTEGER,
                target_name VARCHAR(100),
                success BOOLEAN NOT NULL DEFAULT 0,
                similarity FLOAT,
                threshold FLOAT,
                recognition_time_ms FLOAT,
                feature_dimension INTEGER,
                face_count INTEGER,
                face_size VARCHAR(50),
                image_quality FLOAT,
                error_message TEXT,
                ip_address VARCHAR(50),
                user_agent VARCHAR(200),
                created_at DATETIME NOT NULL DEFAULT (datetime('now'))
            )
        """)

        # 创建索引
        cursor.execute(
            "CREATE INDEX idx_face_log_type ON face_recognition_logs(recognition_type)")
        cursor.execute(
            "CREATE INDEX idx_face_log_created ON face_recognition_logs(created_at)")
        cursor.execute(
            "CREATE INDEX idx_face_log_success ON face_recognition_logs(success)")

        conn.commit()
        conn.close()

        print("[迁移] ✅ face_recognition_logs 表创建成功")
        print("[迁移] 🎉 数据库迁移完成!")
        return True

    except Exception as e:
        print(f"\n[迁移] ❌ 迁移失败: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    import sys
    success = migrate()
    sys.exit(0 if success else 1)
