import asyncio
import re
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()

        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",
                "--disable-dev-shm-usage",
                "--ipc=host",
                "--single-process"
            ],
        )

        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        # Wider default timeout to match the agent's DOM-stability budget;
        # auto-waiting Playwright APIs (expect, locator.wait_for) inherit this.
        context.set_default_timeout(15000)

        # Open a new page in the browser context
        page = await context.new_page()

        # Interact with the page elements to simulate user flow
        # -> navigate
        await page.goto("http://localhost:9002/")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Fill the Email and Password fields with the provided doctor credentials and click the 'Masuk' button to sign in.
        # dokter@puskesmas.id email field
        elem = page.locator('[id="email"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("testsprite-runner@example.com")
        
        # -> Fill the Email and Password fields with the provided doctor credentials and click the 'Masuk' button to sign in.
        # •••••••• password field
        elem = page.locator('[id="password"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("TestSprite123!")
        
        # -> Fill the Email and Password fields with the provided doctor credentials and click the 'Masuk' button to sign in.
        # Masuk button
        elem = page.get_by_role('button', name='Masuk', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Triase Baru' button on the dashboard to start a new triage.
        # Triase Baru Triase button
        elem = page.get_by_role('button', name='Triase Baru Triase', exact=True)
        await elem.click(timeout=10000)
        
        # -> Fill the patient profile: enter 'TS' into the 'Inisial Pasien' field, set 'Usia (tahun)' to 65, select 'Laki-laki (L)' for gender, enter Sistolik 120 and Diastolik 80 so the profile's required fields are populated.
        # misal: BW text field
        elem = page.locator('[id="initial"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("TS")
        
        # -> Fill the patient profile: enter 'TS' into the 'Inisial Pasien' field, set 'Usia (tahun)' to 65, select 'Laki-laki (L)' for gender, enter Sistolik 120 and Diastolik 80 so the profile's required fields are populated.
        # 65 number field
        elem = page.locator('[id="age"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("65")
        
        # -> Fill the patient profile: enter 'TS' into the 'Inisial Pasien' field, set 'Usia (tahun)' to 65, select 'Laki-laki (L)' for gender, enter Sistolik 120 and Diastolik 80 so the profile's required fields are populated.
        # Laki-laki (L) button
        elem = page.get_by_role('button', name='Laki-laki (L)', exact=True)
        await elem.click(timeout=10000)
        
        # -> Fill the patient profile: enter 'TS' into the 'Inisial Pasien' field, set 'Usia (tahun)' to 65, select 'Laki-laki (L)' for gender, enter Sistolik 120 and Diastolik 80 so the profile's required fields are populated.
        # 120 number field
        elem = page.locator('[id="sbp"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("120")
        
        # -> Fill the patient profile: enter 'TS' into the 'Inisial Pasien' field, set 'Usia (tahun)' to 65, select 'Laki-laki (L)' for gender, enter Sistolik 120 and Diastolik 80 so the profile's required fields are populated.
        # 80 number field
        elem = page.locator('[id="dbp"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("80")
        
        # -> Click the 'Lanjut ke Skor I-NEED-HELP' button to advance to the I-NEED-HELP scoring checklist step.
        # Lanjut ke Skor I-NEED-HELP button
        elem = page.get_by_role('button', name='Lanjut ke Skor I-NEED-HELP', exact=True)
        await elem.click(timeout=10000)
        
        # -> Fill the 'Detak Jantung' (heart rate) field with '72' and then click the 'Lanjut ke Skor I-NEED-HELP' button to advance to the I-NEED-HELP scoring checklist.
        # 72 number field
        elem = page.locator('[id="hr"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("72")
        
        # -> Fill the 'Detak Jantung' (heart rate) field with '72' and then click the 'Lanjut ke Skor I-NEED-HELP' button to advance to the I-NEED-HELP scoring checklist.
        # Lanjut ke Skor I-NEED-HELP button
        elem = page.get_by_role('button', name='Lanjut ke Skor I-NEED-HELP', exact=True)
        await elem.click(timeout=10000)
        
        # -> Select a deterioration criterion ('Low BP & High HR') on the I-NEED-HELP checklist and then click the 'Lihat Hasil Triase' button to view the triage result page.
        # button
        elem = page.locator('[id="criteria-L"]')
        await elem.click(timeout=10000)
        
        # -> Select a deterioration criterion ('Low BP & High HR') on the I-NEED-HELP checklist and then click the 'Lihat Hasil Triase' button to view the triage result page.
        # Lihat Hasil Triase button
        elem = page.get_by_role('button', name='Lihat Hasil Triase', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify the triage result page is displayed
        # Assert: The URL contains /triage/, indicating the triage result page is displayed.
        await expect(page).to_have_url(re.compile("/triage/"), timeout=15000), "The URL contains /triage/, indicating the triage result page is displayed."
        await page.locator("xpath=/html/body/div[2]/main/div/div[6]/a/button").nth(0).scroll_into_view_if_needed()
        # Assert: The 'Kembali ke Dashboard' button is visible on the triage result page.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[6]/a/button").nth(0)).to_be_visible(timeout=15000), "The 'Kembali ke Dashboard' button is visible on the triage result page."
        
        # --> Verify a score and recommendation are visible
        # Assert: The I-NEED-HELP score numerator '1' is visible.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[1]/div[2]/div[1]/div[1]/div/span[1]").nth(0)).to_have_text("1", timeout=15000), "The I-NEED-HELP score numerator '1' is visible."
        # Assert: The I-NEED-HELP score denominator '/ 9' is visible.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[1]/div[2]/div[1]/div[1]/div/span[2]").nth(0)).to_have_text("/ 9", timeout=15000), "The I-NEED-HELP score denominator '/ 9' is visible."
        await page.locator("xpath=/html/body/div[2]/main/div/div[4]/div/div/div[1]/span").nth(0).scroll_into_view_if_needed()
        # Assert: The recommendation card icon (🚑) is visible, indicating a clinical recommendation is present.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[4]/div/div/div[1]/span").nth(0)).to_be_visible(timeout=15000), "The recommendation card icon (\ud83d\ude91) is visible, indicating a clinical recommendation is present."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    