import os
import json

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
FOODS_DB_PATH = os.path.join(CURRENT_DIR, "foods_db.json")
INDEX_HTML_PATH = os.path.join(CURRENT_DIR, "..", "index.html")

tagColors = {
    'GI ต่ำ':'green',
    'โปรตีนสูง':'blue',
    'ไขมันต่ำ':'green',
    'ย่อยง่าย':'green',
    'โซเดียมต่ำ':'blue',
    'วิตามินสูง':'green',
    'ใยอาหารสูง':'green',
    'โอเมก้า-3':'blue',
    'คาร์บต่ำ':'orange',
    'เบตาแคโรทีน':'orange',
    'โปรตีนพืช':'green',
    'โปรไบโอติก':'blue',
    'พลังงานเร็ว':'orange',
    'ไขมันดี':'green',
    'สุขภาพหัวใจ':'red',
    'คาร์บสูง':'orange'
}

def build_html():
    with open(FOODS_DB_PATH, "r", encoding="utf-8") as f:
        foods = json.load(f)

    html_parts = []
    
    for meal in ['morning', 'noon', 'evening', 'snack']:
        for f in foods.get(meal, []):
            tags_list = f.get('tags', [])
            if isinstance(tags_list, str):
                tags_list = [tags_list]
            
            tags_html = ""
            for t in tags_list:
                c = tagColors.get(t, 'green')
                tags_html += f'<span class="ftag {c}">{t}</span>\n'

            tags_html += '<span class="ftag red dynamic-tag-disease" style="display:none;">⚠ ควรหลีกเลี่ยง (ตามโรค)</span>\n'
            tags_html += '<span class="ftag red dynamic-tag-bmi" style="display:none;">⚠ ควรหลีกเลี่ยง (ตาม BMI)</span>\n'
            tags_html += '<span class="ftag green dynamic-tag-symptom" style="display:none;">✓ แนะนำ (ตามอาการ)</span>\n'
            tags_html += '<span class="ftag green dynamic-tag-bmic" style="display:none;">✓ แนะนำสำหรับ BMI</span>\n'
            
            img_html = f'<img src="{f["image"]}" alt="{f["name"]}" style="width:100%;height:100%;object-fit:cover;display:block;">' if f.get("image") else f.get("emoji", "")
            bg_style = 'none' if f.get("image") else 'linear-gradient(135deg, var(--green-light), #d4f0e2)'
            
            card_html = f"""
    <div class="food-card" data-meal="{meal}" data-name="{f['name']}" onclick="toggleFoodSelection('{f['name']}', '{meal}')" style="display: {'block' if meal == 'morning' else 'none'};">
      <div class="food-img" style="background:{bg_style}">
        <span class="selected-badge" style="display:none;">✓</span>
        {img_html}
        <span class="kcal-badge">{f.get('kcal', '')}</span>
      </div>
      <div class="food-body">
        <div class="food-name">{f['name']}</div>
        <div class="food-desc">{f.get('desc', '')}</div>
        <div class="food-tags">{tags_html}</div>
        <div class="nutrient-row" style="margin-top:0.7rem;padding-top:0.6rem;border-top:1px solid var(--border)">
          <div class="ntr"><span class="nval">{f.get('p', 0)}g</span>โปรตีน</div>
          <div class="ntr"><span class="nval">{f.get('c', 0)}g</span>คาร์บ</div>
          <div class="ntr"><span class="nval">{f.get('f', 0)}g</span>ไขมัน</div>
          <div class="ntr"><span class="nval">{f.get('sugar', 0)}g</span>น้ำตาล</div>
        </div>
      </div>
    </div>"""
            html_parts.append(card_html)
            
    final_html = "".join(html_parts)
    
    with open(INDEX_HTML_PATH, "r", encoding="utf-8") as f:
        content = f.read()
        
    start_tag = '<div class="food-grid" id="food-grid">'
    end_tag = '</div>\n  </div>\n\n  <!-- LOGIN MODAL -->'
    
    if start_tag in content:
        # Simple extraction and replace
        head = content.split(start_tag)[0]
        tail = content.split('</div>\n  </div>\n\n  <!-- LOGIN MODAL -->')[1]
        new_content = head + start_tag + "\n" + final_html + "\n" + end_tag + tail
        
        with open(INDEX_HTML_PATH, "w", encoding="utf-8") as f:
            f.write(new_content)
        print("Successfully updated index.html")
    else:
        print("Could not find insertion point in index.html")

if __name__ == "__main__":
    build_html()
