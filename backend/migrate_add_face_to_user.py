"""数据库迁移脚本 - 为User表添加人脸识别字段"""
from app import create_app
from extensions import db
import sys
import os

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def migrate():
    """执行数据库迁移"""
    app = create_app()

    with app.app_context():
        try:
            print("[迁移] 开始为 users 表添加人脸识别字段...")

            # 使用 SQLAlchemy 的 migrate 功能
            # 注意: SQLite 不支持 ALTER COLUMN, 需要重建表
            # 但添加新列是可以的

            # 检查字段是否已存在
            inspector = db.inspect(db.engine)
            columns = [col['name'] for col in inspector.get_columns('users')]

            if 'face_descriptor' not in columns:
                print("[迁移] 添加 face_descriptor 字段...")
                db.session.execute(db.text(
                    "ALTER TABLE users ADD COLUMN face_descriptor BLOB"
                ))
                db.session.commit()
                print("[迁移] ✅ face_descriptor 字段添加成功")
            else:
                print("[迁移] ⚠️ face_descriptor 字段已存在,跳过")

            if 'face_image_path' not in columns:
                print("[迁移] 添加 face_image_path 字段...")
                db.session.execute(db.text(
                    "ALTER TABLE users ADD COLUMN face_image_path VARCHAR(500)"
                ))
                db.session.commit()
                print("[迁移] ✅ face_image_path 字段添加成功")
            else:
                print("[迁移] ⚠️ face_image_path 字段已存在,跳过")

            print("\n[迁移] 🎉 数据库迁移完成!")
            print("[迁移] User 表现在支持人脸识别功能")

        except Exception as e:
            db.session.rollback()
            print(f"\n[迁移] ❌ 迁移失败: {e}")
            import traceback
            traceback.print_exc()
            return False

    return True


if __name__ == '__main__':
    success = migrate()
    sys.exit(0 if success else 1)
