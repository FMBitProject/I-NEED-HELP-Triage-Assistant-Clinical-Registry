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
        
        # -> Fill the Email field with 'testsprite-runner@example.com', fill the Password field with 'TestSprite123!', then click the 'Masuk' button to log in.
        # dokter@puskesmas.id email field
        elem = page.locator('[id="email"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("testsprite-runner@example.com")
        
        # -> Fill the Email field with 'testsprite-runner@example.com', fill the Password field with 'TestSprite123!', then click the 'Masuk' button to log in.
        # •••••••• password field
        elem = page.locator('[id="password"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("TestSprite123!")
        
        # -> Fill the Email field with 'testsprite-runner@example.com', fill the Password field with 'TestSprite123!', then click the 'Masuk' button to log in.
        # Masuk button
        elem = page.get_by_role('button', name='Masuk', exact=True)
        await elem.click(timeout=10000)
        
        # -> click
        # Triase Baru link
        elem = page.get_by_role('link', name='Triase Baru', exact=True)
        await elem.click(timeout=10000)
        
        # -> Fill the patient initial with 'TS', select the 'Laki-laki (L)' gender option, and click the 'Lanjut ke Skor I-NEED-HELP' button to proceed to the scoring step.
        # misal: BW text field
        elem = page.locator('[id="initial"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("TS")
        
        # -> Fill the patient initial with 'TS', select the 'Laki-laki (L)' gender option, and click the 'Lanjut ke Skor I-NEED-HELP' button to proceed to the scoring step.
        # Laki-laki (L) button
        elem = page.get_by_role('button', name='Laki-laki (L)', exact=True)
        await elem.click(timeout=10000)
        
        # -> Fill the patient initial with 'TS', select the 'Laki-laki (L)' gender option, and click the 'Lanjut ke Skor I-NEED-HELP' button to proceed to the scoring step.
        # Lanjut ke Skor I-NEED-HELP button
        elem = page.get_by_role('button', name='Lanjut ke Skor I-NEED-HELP', exact=True)
        await elem.click(timeout=10000)
        
        # -> Fill the required baseline fields: 'Usia (tahun)', 'Sistolik (mmHg)', 'Diastolik (mmHg)', and 'Detak Jantung (bpm)' with valid numbers, then click the 'Lanjut ke Skor I-NEED-HELP' button to proceed to the scoring step.
        # 65 number field
        elem = page.locator('[id="dbp"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("65")
        
        # -> Fill the required baseline fields: 'Usia (tahun)', 'Sistolik (mmHg)', 'Diastolik (mmHg)', and 'Detak Jantung (bpm)' with valid numbers, then click the 'Lanjut ke Skor I-NEED-HELP' button to proceed to the scoring step.
        # 120 number field
        elem = page.locator('[id="sbp"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("120")
        
        # -> Fill the required baseline fields: 'Usia (tahun)', 'Sistolik (mmHg)', 'Diastolik (mmHg)', and 'Detak Jantung (bpm)' with valid numbers, then click the 'Lanjut ke Skor I-NEED-HELP' button to proceed to the scoring step.
        # 80 number field
        elem = page.locator('[id="dbp"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("80")
        
        # -> Fill the required baseline fields: 'Usia (tahun)', 'Sistolik (mmHg)', 'Diastolik (mmHg)', and 'Detak Jantung (bpm)' with valid numbers, then click the 'Lanjut ke Skor I-NEED-HELP' button to proceed to the scoring step.
        # 72 number field
        elem = page.locator('[id="hr"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("72")
        
        # -> Fill the required baseline fields: 'Usia (tahun)', 'Sistolik (mmHg)', 'Diastolik (mmHg)', and 'Detak Jantung (bpm)' with valid numbers, then click the 'Lanjut ke Skor I-NEED-HELP' button to proceed to the scoring step.
        # Lanjut ke Skor I-NEED-HELP button
        elem = page.get_by_role('button', name='Lanjut ke Skor I-NEED-HELP', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Inotropik IV' checkbox, then click the 'NYHA / Natriuretic Peptide' checkbox, and verify the displayed 'Skor saat ini' updates from 0 to 1 then to 2.
        # button
        elem = page.locator('[id="criteria-I"]')
        await elem.click(timeout=10000)
        
        # -> Click the 'Inotropik IV' checkbox, then click the 'NYHA / Natriuretic Peptide' checkbox, and verify the displayed 'Skor saat ini' updates from 0 to 1 then to 2.
        # button
        elem = page.locator('[id="criteria-N"]')
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify the live triage score updates
        # Assert: The live triage score displays 2 after selecting the criteria.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[4]/div[1]/div/div/div[1]/div/span[1]").nth(0)).to_have_text("2", timeout=15000), "The live triage score displays 2 after selecting the criteria."
        
        # --> Verify the selected criteria are reflected in the scoring step
        # Assert: The 'Inotropik IV' criterion is shown as selected.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[4]/div[2]/label[1]/button").nth(0)).to_have_attribute("value", "on", timeout=15000), "The 'Inotropik IV' criterion is shown as selected."
        # Assert: The 'NYHA / Natriuretic Peptide' criterion is shown as selected.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[4]/div[2]/label[2]/button").nth(0)).to_have_attribute("value", "on", timeout=15000), "The 'NYHA / Natriuretic Peptide' criterion is shown as selected."
        # Assert: The live score displays '2', reflecting two selected criteria.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[4]/div[1]/div/div/div[1]/div/span[1]").nth(0)).to_have_text("2", timeout=15000), "The live score displays '2', reflecting two selected criteria."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    