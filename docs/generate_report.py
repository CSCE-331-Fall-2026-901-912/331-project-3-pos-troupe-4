import os, zipfile, xml.sax.saxutils

escape = xml.sax.saxutils.escape

findings_intro = """The user study evaluated the system across five external participants representing varied levels of technical background, ordering familiarity, and accessibility awareness (including participants with software development and food service experience). Quantitative Likert evaluations demonstrated a strong overall baseline—average satisfaction was 4.40 / 5.00, ease of navigation was 4.60 / 5.00, and feature discoverability was 4.60 / 5.00. However, qualitative feedback revealed critical blind spots in business logic, menu discovery, cart management, and system feedback."""

findings_sections = [
    ("Overall Usability and General Impressions",
     "Participants universally praised the cleanliness, straightforward workflow, and semantic HTML accessibility foundation. Testers noted that navigating between different roles was intuitive and that product selection and basic ordering operations were easy to locate. Accessibility-conscious participants specifically commended the inclusion of built-in text resizing and high-contrast controls. The system was broadly characterized as approachable and functional for a casual bubble tea customer."),
    ("Theme 1: Ingredient Customization Boundaries and Menu Logic (Blind Spot)",
     "A primary blind spot uncovered during testing was the lack of separation between consumable recipe ingredients and physical packaging items in the drink customization interface. Three out of five participants explicitly noted that customers were permitted to deselect essential operational items such as cups, lids, and straws (e.g., placing an order with 'No Cup'). Participants with prior food service experience highlighted that packaging materials must not be customer-modifiable constituents, as this creates nonsensical kitchen orders and breaks real-world inventory tracking. Furthermore, users expressed confusion over which customization choices were required versus optional, noting the absence of pre-selected defaults for ice and sugar levels."),
    ("Theme 2: Drink Catalog Organization and Cognitive Strain",
     "While participants appreciated the breadth of menu offerings and available add-ins, multiple testers experienced friction when attempting to locate specific drinks. In earlier iterations, all menu items and add-in constituents were displayed in an unorganized, flat grid without category headers or search functionality. This presented substantial cognitive load, forcing users to visually scan through every card sequentially to find a desired drink (such as distinguishing fruit teas from milk teas) or topping. Participants indicated that categorizing the drinks and add-ins is essential for rapid kiosk decision-making."),
    ("Theme 3: Cart Modification and Viewport Ergonomics",
     "A major workflow hurdle occurred during the review phase: once a drink was customized and added to the cart, the system provided only a 'Remove' button with no mechanism to modify selections. Participants who wished to alter an ice level or add an omitted topping had to delete the entire item and reconstruct it from scratch. Additionally, on mobile and smaller tablet viewports, users reported that the order total and submission buttons were pushed below the fold beneath long lists of customizations, requiring excessive scrolling to verify prices and complete checkout."),
    ("Theme 4: Cross-Interface Visual Cohesion and Navigation Predictability",
     "Participants noted noticeable visual and structural disparity across the system's different views. While individual pages had appealing elements, the design language varied noticeably between the Kiosk menu, Cashier screen, and Kitchen dashboard. For instance, the button styles, background colors, and typography varied between the customization modal and the checkout screen. Navigation predictability was also inconsistent: several views lacked an obvious 'Back to Menu' or 'Return to Portal' escape route, forcing users to rely on the browser's native back button or leaving them unsure of how to return to the home screen."),
    ("Theme 5: Kitchen Operational Maturity and Button Responsiveness",
     "The Kitchen display screen was identified as the least mature component in the application. Testers observed that kitchen action buttons (such as status progression or ticket undo) did not produce visible UI feedback or state updates, leading users to believe the buttons were inactive or broken. Furthermore, tickets lacked a clear visual distinction between standard ingredients, customer-requested add-ins, and omitted items, making it difficult for kitchen staff to quickly interpret order tickets at a glance."),
    ("Theme 6: Accessibility Control Safeguards",
     "While the accessibility toolbar was well-received by participants, edge-case testing revealed a critical usability bug: reducing the font size to its minimum allowed setting caused all text content across the site to vanish entirely, breaking the interface. Testers noted that while scaling is vital for low-vision users, strict bounding limits must be enforced to ensure readability is never compromised.")
]

design_moves = [
    ("Packaging & Constituent Whitelist Filtering",
     "Filter out all non-consumable packaging items (cups, lids, straws, napkins, sleeves) from the customer customization interface, exposing only consumable recipe ingredients (tea base, milk, sugar, ice, boba) for removal or addition.",
     "Directly resolves the primary blind spot raised by Participants 1, 3, and 4; prevents invalid orders ('drink with no cup') and aligns POS behavior with commercial food-service standards."),
    ("Menu Categorization, Search, & Sorting Controls",
     "Implement sticky category filter tabs (All, Milk Teas, Fruit & Green Teas, Specialties), a text-based live search input, and sorting dropdowns (price, name) on the Kiosk and Cashier menus.",
     "Eliminates the severe cognitive overload and scanning friction reported by Participant 4, allowing users to rapidly find target beverages without hunting through an unorganized grid."),
    ("In-Cart Item Modification",
     "Add a 'Modify' / 'Edit' action button alongside the 'Remove' option in both Kiosk checkout and Cashier cart views. Clicking it reopens the customization screen pre-populated with the item's current configuration, updating the cart entry upon confirmation.",
     "Eliminates the critical user frustration identified by Participant 4, where customers had to completely delete and re-customize an item to make minor adjustments."),
    ("Fixed Bottom Action Bar & Responsive Cart Summary",
     "Redesign the customization and ordering views to incorporate a fixed bottom footer (.order-bar) containing running item count, real-time subtotal calculation, 'Back to Menu', and primary 'Add to Order' / 'Save Changes' actions.",
     "Prevents critical order totals and submission buttons from being pushed below the fold on mobile and tablet viewports, directly solving Participant 4's viewport scrolling issue."),
    ("Interactive Kitchen Display System (KDS) & Status Tracking",
     "Upgrade kitchen tickets to clearly highlight added toppings in green, display omitted constituents with strikethroughs, and provide reactive status advancement (Pending → In Progress → Complete) with responsive, high-contrast action buttons.",
     "Directly resolves feedback from Participants 3 and 5, who observed non-reactive kitchen buttons and a lack of granular modification visibility on order tickets."),
    ("Kitchen Layout Masonry & Dynamic History Loading",
     "Transition the kitchen order board from a rigid, stretched CSS grid to a multi-column masonry flow where cards adapt strictly to ticket length. Replace hardcoded order limits with a 'Load Previous 10 Orders' dynamic query and 'Live Orders' tab.",
     "Eliminates excessive vertical whitespace caused by uneven order lengths and ensures kitchen staff can focus on live tickets while retaining on-demand access to past orders."),
    ("Universal Navigation Header (AppHeader)",
     "Deploy a standardized top header across all views featuring a clean home portal navigation icon, persistent active-role indicator, and integrated font size / high-contrast accessibility controls.",
     "Eliminates navigation dead ends highlighted by Participant 2 by ensuring users can always return to the main portal from any screen without browser-level workarounds."),
    ("Unified Design System & Palette Harmonization",
     "Centralize color tokens (#2E6F5E primary, #A7C957 secondary, #D9F0E1 accent), standardized typography, rounded card borders, and reusable button variants (btn-primary, btn-secondary, btn-outline) across Kiosk, Cashier, Kitchen, and Manager pages.",
     "Resolves visual inconsistency and mismatched styling across windows reported by Participants 1, 4, and 5, establishing a cohesive, professional aesthetic."),
    ("Accessibility Scale Bounds & Contrast Safeguards",
     "Implement strict boundary clamps on font resizing (minimum 80%, maximum 140%) and verify dark, high-contrast typography across all buttons (e.g., #142816 on light green backdrops).",
     "Fixes the severe bug discovered by Participant 4 where text disappeared at minimum scale, and ensures compliant, readable contrast across all buttons.")
]

appendix_rows = [
    ("What was your overall first impression of the app?",
     "• \"I think the design is clean however could be more consistent between the different windows. For example, the kiosk menu has different styles for the different screens.\"\n• \"It looked easy to navigate and there was a clear wording for all the different types of sections.\"\n• \"Very polished.\"\n• \"It feels very plain but it is easy to understand and navigating through the different windows made sense.\"\n• \"The app looks pretty in certain areas, but in general the overall consistency of the design is variable.\"",
     "The first impression is generally positive and users find navigation intuitive, but visual inconsistency between screens and roles is immediately noticeable to discerning users."),
    ("Was anything confusing or difficult to navigate? If so, what?",
     "• \"I didn't find anything confusing or difficult to navigate. I think that the kiosk, cashier, and kitchen mode were very intuitive.\"\n• \"It was not clear how to go back on some pages there wasn’t a designated button to go back a page like the kitchen page had a button on the website that took you back to the portal not all pages had that.\"\n• \"I can remove my cup.\"\n• \"Looking through all the drink options was somewhat confusing because they were all laid out on the page without any organization. Would make it harder to find a specific type of drink. Same with the add-in options.\"\n• \"Wasn't super confusing to navigate except sometimes I wish the filter state was in the URL so going back didn't ruin stuff like the start and end date.\"",
     "Highlights three major points of friction: missing back/portal navigation on certain pages, lack of menu categorization, and the illogical ability to remove cups from drink orders."),
    ("Did any features work differently than you expected?",
     "• \"I found it interesting that I could remove the cups and lids from the order. But other than that, everything worked as expected.\"\n• \"None.\"\n• \"Kitchen? Undo button does nothing.\"\n• \"Clicking on the included items to remove them was different than what I am used to with online ordering. Usually there are separate options to click 'no whatever'.\"\n• \"Kitchen mode is a lot less mature than I would have expected. The buttons didn't do anything... and I couldn't expand any of the order products to see what modifications were made to the order.\"",
     "Unanimous confusion around removing packaging (cups/lids) and strong criticism regarding non-reactive kitchen action buttons and lack of modification breakdown on tickets."),
    ("Was there anything you particularly liked about the application?",
     "• \"I liked how straightforward it was to use. It wasn't very complicated and I could easily locate all the functions.\"\n• \"I liked how when you would hover over the buttons on a product it would change colors and you could clearly see what product you were pressing.\"\n• \"I loved the color, well organized.\"\n• \"I liked the categories and amount of customization options for drinks, and I liked being able to see the customization options I added on the checkout screen.\"\n• \"I really like the fact that this app is made with semantic HTML and proper tags... accessibility is not a concern. The way this website was made makes me happy.\"",
     "Users appreciate clear hover states, semantic HTML, accessibility features, straightforward ordering, and transparent customization breakdowns on checkout."),
    ("Was there anything you felt was missing or could be improved?",
     "• \"There should be a notes functionality. Sometimes people have allergies or special requests that menu options can't cover.\"\n• \"A back button on each page.\"\n• \"No.\"\n• \"Decreasing font size all the way made all text disappear. When tapping to remove items some options didn't make sense (selecting no cup or no straw). No option to edit specific items in your order. You have to scroll down to see order total and place order button... Font is different on check-out menu.\"\n• \"Kitchen view needs work. The design language needs to be more uniform throughout the app... There needs to be real users so not anyone can just delete whatever.\"",
     "Uncovered critical functional gaps: in-cart item modification, back buttons, fixed totals above the fold, kitchen responsiveness, allergen/order notes, and font size scaling boundaries."),
    ("If you were using this system at an actual bubble tea shop, how would you describe your experience?",
     "• \"8/10.\"\n• \"It was a great experience and the website was easy to use. I liked how you could zoom in and out on the website changing the font size.\"\n• \"Great menu, but I can remove my cup.\"\n• \"It was simple and easy to understand and felt intuitive navigating through the different windows. It was difficult to sort through all the drink options and find what I was looking for.\"\n• \"For the Kiosk, honestly this isn't the worst I've seen for a bubble tea shop... The customization is a bit overwhelming to look at given the sheer amount of options present.\"",
     "Real-world viability is strong (8/10 overall sentiment), but menu scanning and overwhelming customization options must be mitigated with tabs and filtering."),
    ("The application was easy to navigate.",
     "Rating: 4.60 / 5.00 (Responses: 4, 5, 5, 4, 5)",
     "Navigation structure is solid, with strong consensus that paths through the app are clear."),
    ("The layout and organization of the application were intuitive.",
     "Rating: 4.40 / 5.00 (Responses: 4, 5, 5, 5, 3)",
     "General layout is intuitive, though lower scores correlate with unstructured drink/add-in lists and kitchen ticket layout."),
    ("I could easily find the features I needed.",
     "Rating: 4.60 / 5.00 (Responses: 4, 5, 5, 4, 5)",
     "Core features are prominent and discoverable without hidden menus or complex hierarchies."),
    ("The ordering and customization process was straightforward.",
     "Rating: 4.20 / 5.00 (Responses: 4, 5, 5, 3, 4)",
     "Slightly lower rating driven by inability to modify items in the cart and confusing packaging removal options."),
    ("The buttons, labels, and instructions were clear.",
     "Rating: 4.20 / 5.00 (Responses: 4, 5, 4, 4, 4)",
     "Labels are clear, but action differentiation (e.g., differentiating 'Add to Order' from 'Back' via color) could be stronger."),
    ("The application responded as I expected when I interacted with it.",
     "Rating: 4.40 / 5.00 (Responses: 4, 5, 3, 5, 5)",
     "Dips occurred specifically when participants tested the Kitchen view buttons and found them non-responsive."),
    ("I would feel comfortable using this application in a real bubble tea shop.",
     "Rating: 4.20 / 5.00 (Responses: 4, 5, 5, 4, 3)",
     "Users express readiness for real-world deployment, contingent on removing cups from the menu and organizing drinks into categories."),
    ("Overall, I am satisfied with the user experience.",
     "Rating: 4.40 / 5.00 (Responses: 4, 5, 5, 4, 4)",
     "High overall user satisfaction demonstrates that the core architecture is sound and well-received."),
    ("Is there anything else you would change, add, or improve?",
     "• \"None\"\n• \"Pumpkin Thai Tea\"\n• \"Add categories for drink menu like milk teas, fruit teas, lemonade, etc. Add categories for add-ins like syrups, boba, etc. 'Add to order' and 'back' buttons could be made a different color... Checkout screen could include total number of items... Defaults that are already selected... Indicate which selections are optional... Drink sizes.\"\n• \"I really just want the kitchen view to do anything.\"",
     "Actionable roadmap recommendations emphasizing drink categorization, kitchen interactivity, button contrast, sensible defaults, and item modification.")
]

# 1. HTML
html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>User Report Sections - CSCE 331 POS</title>
<style>
  body {{
    font-family: Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    line-height: 1.6;
    color: #1e293b;
    background-color: #ffffff;
    max-width: 960px;
    margin: 2rem auto;
    padding: 0 1.5rem;
  }}
  h1 {{
    color: #2E6F5E;
    border-bottom: 2px solid #2E6F5E;
    padding-bottom: 0.4rem;
    margin-top: 2rem;
    font-size: 1.85rem;
  }}
  h2 {{
    color: #2E6F5E;
    margin-top: 1.6rem;
    margin-bottom: 0.5rem;
    font-size: 1.35rem;
  }}
  h3 {{
    color: #1e293b;
    margin-top: 1.25rem;
    margin-bottom: 0.35rem;
    font-size: 1.1rem;
    font-weight: 700;
  }}
  p {{
    margin-bottom: 0.9rem;
    text-align: justify;
  }}
  table {{
    width: 100%;
    border-collapse: collapse;
    margin: 1.5rem 0;
    font-size: 0.95rem;
  }}
  th, td {{
    border: 1px solid #cbd5e1;
    padding: 0.75rem 1rem;
    text-align: left;
    vertical-align: top;
  }}
  th {{
    background-color: #D9F0E1;
    color: #1A4338;
    font-weight: 700;
  }}
  tr:nth-child(even) td {{
    background-color: #f8fafc;
  }}
  .callout {{
    background-color: #f1f8f4;
    border-left: 4px solid #2E6F5E;
    padding: 0.85rem 1.25rem;
    margin: 1rem 0;
    font-size: 0.95rem;
  }}
</style>
</head>
<body>

<div class="callout">
  <strong>Google Docs Paste Tip:</strong> Select everything on this page (<code>Ctrl+A</code> or <code>Cmd+A</code>), copy it (<code>Ctrl+C</code> or <code>Cmd+C</code>), and paste it directly into your Google Doc. Google Docs will automatically convert these sections into native styled headings, formatted paragraphs, and clean native document tables!
</div>

<h1>User Study Findings</h1>
<p>{escape(findings_intro)}</p>
"""

for title, para in findings_sections:
    html_content += f"<h3>{escape(title)}</h3>\n<p>{escape(para)}</p>\n"

html_content += """\n<h1>Proposed Design Moves</h1>\n<table>
<thead>
  <tr>
    <th style="width: 25%;">High-level Design Move</th>
    <th style="width: 45%;">Detailed Description</th>
    <th style="width: 30%;">Justification</th>
  </tr>
</thead>
<tbody>
"""

for hld, desc, just in design_moves:
    html_content += f"""  <tr>
    <td><strong>{escape(hld)}</strong></td>
    <td>{escape(desc)}</td>
    <td>{escape(just)}</td>
  </tr>\n"""

html_content += """</tbody>
</table>

<h1>Appendix: User Study Data</h1>
<p><em>Documents the user survey activity data and insights supporting the study findings and proposed design moves.</em></p>
<table>
<thead>
  <tr>
    <th style="width: 28%;">Question</th>
    <th style="width: 44%;">Survey Response(s) / Data Summary</th>
    <th style="width: 28%;">Insight</th>
  </tr>
</thead>
<tbody>
"""

for q, resp, insight in appendix_rows:
    resp_formatted = escape(resp).replace('\n', '<br>')
    html_content += f"""  <tr>
    <td><strong>{escape(q)}</strong></td>
    <td>{resp_formatted}</td>
    <td>{escape(insight)}</td>
  </tr>\n"""

html_content += """</tbody>
</table>

</body>
</html>
"""

docs_dir = os.path.dirname(os.path.abspath(__file__))
out_html = os.path.join(docs_dir, 'user_report_sections.html')
with open(out_html, 'w', encoding='utf-8') as f:
    f.write(html_content)
print(f'Wrote HTML to {out_html}')

# 2. DOCX
content_types = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>'''

rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>'''

doc_rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>'''

body_xml = []

def p_h1(text):
    return f'''<w:p>
      <w:pPr><w:spacing w:before="360" w:after="140"/></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:b/><w:color w:val="2E6F5E"/><w:sz w:val="34"/></w:rPr>
        <w:t>{escape(text)}</w:t>
      </w:r>
    </w:p>'''

def p_h3(text):
    return f'''<w:p>
      <w:pPr><w:spacing w:before="240" w:after="80"/></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:b/><w:color w:val="1E293B"/><w:sz w:val="24"/></w:rPr>
        <w:t>{escape(text)}</w:t>
      </w:r>
    </w:p>'''

def p_body(text):
    return f'''<w:p>
      <w:pPr><w:spacing w:after="140" w:line="276" w:lineRule="auto"/></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="22"/></w:rPr>
        <w:t>{escape(text)}</w:t>
      </w:r>
    </w:p>'''

def build_table(headers, rows, widths):
    tbl = ['''<w:tbl>
      <w:tblPr>
        <w:tblW w:w="5000" w:type="pct"/>
        <w:tblCellMar>
          <w:top w:w="120" w:type="dxa"/>
          <w:left w:w="160" w:type="dxa"/>
          <w:bottom w:w="120" w:type="dxa"/>
          <w:right w:w="160" w:type="dxa"/>
        </w:tblCellMar>
        <w:tblBorders>
          <w:top w:val="single" w:sz="6" w:space="0" w:color="CCCCCC"/>
          <w:left w:val="single" w:sz="6" w:space="0" w:color="CCCCCC"/>
          <w:bottom w:val="single" w:sz="6" w:space="0" w:color="CCCCCC"/>
          <w:right w:val="single" w:sz="6" w:space="0" w:color="CCCCCC"/>
          <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E5ECE6"/>
          <w:insideV w:val="single" w:sz="4" w:space="0" w:color="E5ECE6"/>
        </w:tblBorders>
      </w:tblPr>''']

    hdr_cells = []
    for i, h in enumerate(headers):
        w = widths[i]
        hdr_cells.append(f'''<w:tc>
          <w:tcPr>
            <w:tcW w:w="{w}" w:type="pct"/>
            <w:shd w:val="clear" w:color="auto" w:fill="D9F0E1"/>
          </w:tcPr>
          <w:p>
            <w:pPr><w:spacing w:after="40"/></w:pPr>
            <w:r>
              <w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:b/><w:color w:val="1A4338"/><w:sz w:val="22"/></w:rPr>
              <w:t>{escape(h)}</w:t>
            </w:r>
          </w:p>
        </w:tc>''')
    tbl.append(f'<w:tr>{"".join(hdr_cells)}</w:tr>')

    for row_idx, r in enumerate(rows):
        row_cells = []
        shd_color = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, cell_text in enumerate(r):
            w = widths[col_idx]
            lines = cell_text.split('\n')
            p_elements = []
            for l in lines:
                is_bold = l.startswith('Rating:') or (col_idx == 0 and len(lines) == 1)
                p_elements.append(f'''<w:p>
                  <w:pPr><w:spacing w:after="60"/></w:pPr>
                  <w:r>
                    <w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/>{"<w:b/>" if is_bold else ""}<w:sz w:val="20"/></w:rPr>
                    <w:t>{escape(l)}</w:t>
                  </w:r>
                </w:p>''')
            row_cells.append(f'''<w:tc>
              <w:tcPr>
                <w:tcW w:w="{w}" w:type="pct"/>
                <w:shd w:val="clear" w:color="auto" w:fill="{shd_color}"/>
              </w:tcPr>
              {"".join(p_elements)}
            </w:tc>''')
        tbl.append(f'<w:tr>{"".join(row_cells)}</w:tr>')

    tbl.append('</w:tbl>')
    return "\n".join(tbl)

body_xml.append(p_h1("User Study Findings"))
body_xml.append(p_body(findings_intro))
for t, p in findings_sections:
    body_xml.append(p_h3(t))
    body_xml.append(p_body(p))

body_xml.append(p_h1("Proposed Design Moves"))
design_headers = ["High-level Design Move", "Detailed Description", "Justification"]
design_widths = [1250, 2250, 1500]
body_xml.append(build_table(design_headers, design_moves, design_widths))

body_xml.append(p_h1("Appendix: User Study Data"))
body_xml.append(p_body("Documents the user survey activity data and insights supporting the study findings and proposed design moves."))
app_headers = ["Question", "Survey Response(s) / Data Summary", "Insight"]
app_widths = [1400, 2200, 1400]
body_xml.append(build_table(app_headers, appendix_rows, app_widths))

doc_xml = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    {"".join(body_xml)}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>'''

out_docx = os.path.join(docs_dir, 'user_report_sections.docx')
with zipfile.ZipFile(out_docx, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('[Content_Types].xml', content_types)
    z.writestr('_rels/.rels', rels)
    z.writestr('word/_rels/document.xml.rels', doc_rels)
    z.writestr('word/document.xml', doc_xml)
print(f'Wrote DOCX to {out_docx}')

# 3. MARKDOWN
md_content = f"""# User Study Findings

{findings_intro}

"""
for title, para in findings_sections:
    md_content += f"### {title}\n\n{para}\n\n"

md_content += """# Proposed Design Moves

| High-level Design Move | Detailed Description | Justification |
| :--- | :--- | :--- |
"""
for hld, desc, just in design_moves:
    md_content += f"| **{hld}** | {desc} | {just} |\n"

md_content += """
# Appendix: User Study Data

| Question | Survey Response(s) / Data Summary | Insight |
| :--- | :--- | :--- |
"""
for q, resp, insight in appendix_rows:
    resp_clean = resp.replace('\n', '<br>')
    md_content += f"| **{q}** | {resp_clean} | {insight} |\n"

out_md = os.path.join(docs_dir, 'user_report_sections.md')
with open(out_md, 'w', encoding='utf-8') as f:
    f.write(md_content)
print(f'Wrote Markdown to {out_md}')
