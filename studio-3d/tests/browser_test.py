from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw
from pathlib import Path
base=Path(__file__).resolve().parents[1]
img=Image.new('RGB',(420,320),(50,50,50))
d=ImageDraw.Draw(img)
d.ellipse((80,30,345,280),fill=(230,230,230))
d.rectangle((150,90,285,190),fill=(100,100,100))
img.save(base/'tests/sample.png')
console=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 page=browser.new_page(viewport={'width':412,'height':915},device_scale_factor=1,is_mobile=True,has_touch=True,accept_downloads=True)
 page.on('pageerror',lambda e: console.append(str(e)))
 page.set_content((base/'2H4Y_3D_Studio_1.0.html').read_text(),wait_until='load')
 page.wait_for_timeout(400)
 print('initial status:',page.locator('#status').inner_text())
 assert page.locator('.tab.active').count()==1
 page.locator('#photoFile').set_input_files(str(base/'tests/sample.png'))
 page.wait_for_timeout(350)
 rect=page.locator('#imageCanvas').bounding_box(); assert rect
 page.mouse.move(rect['x']+rect['width']*.1,rect['y']+rect['height']*.1)
 page.mouse.down();page.mouse.move(rect['x']+rect['width']*.85,rect['y']+rect['height']*.9,steps=8);page.mouse.up()
 assert 'markiert' in page.locator('#cropInfo').inner_text()
 page.locator('#generate').click()
 page.wait_for_timeout(850)
 print('generate:',page.locator('#status').inner_text(), 'stats:',page.locator('#modelstats').inner_text())
 assert not page.locator('#saveSTL').is_disabled()
 assert 'Dreiecke' in page.locator('#modelstats').inner_text()
 page.screenshot(path=str(base/'Vorschau_2H4Y_3D_Studio_1.0.png'),full_page=True)
 with page.expect_download(timeout=12000) as dl:
  page.locator('#saveSTL').click()
 download=dl.value
 print('download:',download.suggested_filename)
 download.save_as(str(base/'tests/exported_sample.stl'))
 assert (base/'tests/exported_sample.stl').stat().st_size>10000
 page.locator('button[data-tab="shapes"]').click();page.locator('#makeShape').click();assert 'Quader' in page.locator('#modelname').inner_text()
 page.locator('button[data-tab="viewer"]').click();page.locator('#modelFile').set_input_files(str(base/'tests/exported_sample.stl'))
 page.wait_for_timeout(250);assert 'exported_sample.stl' in page.locator('#modelname').inner_text()
 page.locator('#update').click();assert not page.locator('#updateDialog').is_hidden();page.locator('#closeUpdate').click()
 print('browser errors:',console)
 assert not console, console
 browser.close()
print('BROWSER TEST PASS')
