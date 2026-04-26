"""简化的数据库迁移脚本 - 为User表添加人脸识别字段(不依赖torch)"""
import sqlite3
import sys
import os

# 获取数据库路径
db_path = os.path.join(os.path.dirname(__file__), 'data', 'aixray.db')


def migrate():
    """执行数据库迁移"""
    try:
        print("[迁移] 开始为 users 表添加人脸识别字段...")
        print(f"[迁移] 数据库路径: {db_path}")

        # 检查数据库文件是否存在
        if not os.path.exists(db_path):
            print(f"[迁移] ❌ 数据库文件不存在: {db_path}")
            return False

        # 连接数据库
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # 检查字段是否已存在
        cursor.execute("PRAGMA table_info(users)")
        columns = [row[1] for row in cursor.fetchall()]

        print(f"[迁移] 当前users表字段: {', '.join(columns)}")

        # 添加 face_descriptor 字段
        if 'face_descriptor' not in columns:
            print("[迁移] 添加 face_descriptor 字段...")
            cursor.execute("ALTER TABLE users ADD COLUMN face_descriptor BLOB")
            conn.commit()
            print("[迁移] ✅ face_descriptor 字段添加成功")
        else:
            print("[迁移] ⚠️ face_descriptor 字段已存在,跳过")

        # 添加 face_image_path 字段
        if 'face_image_path' not in columns:
            print("[迁移] 添加 face_image_path 字段...")
            cursor.execute(
                "ALTER TABLE users ADD COLUMN face_image_path VARCHAR(500)")
            conn.commit()
            print("[迁移] ✅ face_image_path 字段添加成功")
        else:
            print("[迁移] ⚠️ face_image_path 字段已存在,跳过")

        # 验证修改
        cursor.execute("PRAGMA table_info(users)")
        new_columns = [row[1] for row in cursor.fetchall()]
        print(f"\n[迁移] 更新后users表字段: {', '.join(new_columns)}")

        conn.close()

        print("\n[迁移] 🎉 数据库迁移完成!")
        print("[迁移] User 表现在支持人脸识别功能")
        return True

    except Exception as e:
        print(f"\n[迁移] ❌ 迁移失败: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    success = migrate()
    sys.exit(0 if success else 1)
