import sys
import os

# Add to path to import app modules
sys.path.append(os.path.abspath(os.path.dirname(__file__) + '/../../'))

from ai.entity.entity_processor import group_entities_with_proximity
from app.utils.normalizer import FLOWER_MAP, COLOR_MAP

text1 = "bó hoa lan đỏ, giấy gói đen và ruy băng đỏ"
text2 = "giỏ hoa hồng vàng, lẵng hoa cúc trắng"

print("--- TEXT 1 ---")
nouns1 = group_entities_with_proximity(text1, {})
for n in nouns1:
    print(n)

print("\n--- TEXT 2 ---")
nouns2 = group_entities_with_proximity(text2, {})
for n in nouns2:
    print(n)
