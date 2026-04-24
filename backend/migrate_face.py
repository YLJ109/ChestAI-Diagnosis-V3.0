"""数据库迁移脚本 - 添加人脸识别字段"""
import sqlite3
import os


def migrate():
    """执行迁移"""
    db_path = os.path.join(os.path.dirname(__file__), 'data', 'aixray.db')

    if not os.path.exists(db_path):
        print(f"[迁移] ❌ 数据库文件不存在: {db_path}")
        return

    print(f"[迁移] 开始添加人脸识别字段...")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # 检查字段是否已存在
        cursor.execute("PRAGMA table_info(patients)")
        columns = [row[1] for row in cursor.fetchall()]

        if 'face_descriptor' in columns and 'face_image_path' in columns:
            print("[迁移] ✅ 人脸识别字段已存在，无需迁移")
            conn.close()
            return

        # 添加 face_descriptor 字段
        if 'face_descriptor' not in columns:
            cursor.execute(
                "ALTER TABLE patients ADD COLUMN face_descriptor BLOB")
            print("[迁移] 已添加 face_descriptor 字段")

        # 添加 face_image_path 字段
        if 'face_image_path' not in columns:
            cursor.execute(
                "ALTER TABLE patients ADD COLUMN face_image_path VARCHAR(255)")
            print("[迁移] 已添加 face_image_path 字段")

        conn.commit()
        print("[迁移] ✅ 数据库迁移成功")

    except Exception as e:
        conn.rollback()
        print(f"[迁移] ❌ 迁移失败: {e}")
        raise
    finally:
        conn.close()


if __name__ == '__main__':
    migrate()
