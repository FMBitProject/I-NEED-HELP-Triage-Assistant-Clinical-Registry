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
        
        # -> Open the application's Login page by navigating to the site's /login URL and wait for it to load so the email and password fields become visible.
        await page.goto("http://localhost:9002/login")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Fill the Email field with testsprite-runner@example.com, fill the Password field with TestSprite123!, then click the 'Masuk' (Login) button to submit the login form.
        # dokter@puskesmas.id email field
        elem = page.locator('[id="email"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("testsprite-runner@example.com")
        
        # -> Fill the Email field with testsprite-runner@example.com, fill the Password field with TestSprite123!, then click the 'Masuk' (Login) button to submit the login form.
        # •••••••• password field
        elem = page.locator('[id="password"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("TestSprite123!")
        
        # -> Fill the Email field with testsprite-runner@example.com, fill the Password field with TestSprite123!, then click the 'Masuk' (Login) button to submit the login form.
        # Masuk button
        elem = page.get_by_role('button', name='Masuk', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the '+ Triase Baru' (Triase Baru) button to open the new triage form (navigate to the triage creation page).
        # Triase Baru Triase button
        elem = page.get_by_role('button', name='Triase Baru Triase', exact=True)
        await elem.click(timeout=10000)
        
        # -> Fill the patient profile required fields: enter 'TS' into the Initial field, set Age to '65', select 'Laki-laki (L)' for gender, set Sistolik to '120' and Diastolik to '80'.
        # misal: BW text field
        elem = page.locator('[id="initial"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("TS")
        
        # -> Fill the patient profile required fields: enter 'TS' into the Initial field, set Age to '65', select 'Laki-laki (L)' for gender, set Sistolik to '120' and Diastolik to '80'.
        # 65 number field
        elem = page.locator('[id="age"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("65")
        
        # -> Fill the patient profile required fields: enter 'TS' into the Initial field, set Age to '65', select 'Laki-laki (L)' for gender, set Sistolik to '120' and Diastolik to '80'.
        # Laki-laki (L) button
        elem = page.get_by_role('button', name='Laki-laki (L)', exact=True)
        await elem.click(timeout=10000)
        
        # -> Fill the patient profile required fields: enter 'TS' into the Initial field, set Age to '65', select 'Laki-laki (L)' for gender, set Sistolik to '120' and Diastolik to '80'.
        # 120 number field
        elem = page.locator('[id="sbp"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("120")
        
        # -> Fill the patient profile required fields: enter 'TS' into the Initial field, set Age to '65', select 'Laki-laki (L)' for gender, set Sistolik to '120' and Diastolik to '80'.
        # 80 number field
        elem = page.locator('[id="dbp"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("80")
        
        # -> Click the 'Lanjut ke Skor I-NEED-HELP' button to go to the I-NEED-HELP checklist/score step.
        # Lanjut ke Skor I-NEED-HELP button
        elem = page.get_by_role('button', name='Lanjut ke Skor I-NEED-HELP', exact=True)
        await elem.click(timeout=10000)
        
        # -> Fill 'Detak Jantung' (Heart Rate) with '72' and click the 'Lanjut ke Skor I-NEED-HELP' button to proceed to the I-NEED-HELP checklist.
        # 72 number field
        elem = page.locator('[id="hr"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("72")
        
        # -> Fill 'Detak Jantung' (Heart Rate) with '72' and click the 'Lanjut ke Skor I-NEED-HELP' button to proceed to the I-NEED-HELP checklist.
        # Lanjut ke Skor I-NEED-HELP button
        elem = page.get_by_role('button', name='Lanjut ke Skor I-NEED-HELP', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Lihat Hasil Triase' button to open the triage result page and verify the visible recommendation (expecting a continue-GDMT recommendation) and that the criteria summary indicates low risk (0/9).
        # Lihat Hasil Triase button
        elem = page.get_by_role('button', name='Lihat Hasil Triase', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify the continue GDMT recommendation is visible
        await page.locator("xpath=/html/body/div[2]/main/div/div[3]/div/div/div[1]/span").nth(0).scroll_into_view_if_needed()
        # Assert: The continue-GDMT recommendation card (✅) is visible.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[3]/div/div/div[1]/span").nth(0)).to_be_visible(timeout=15000), "The continue-GDMT recommendation card (\u2705) is visible."
        
        # --> Verify the criteria summary reflects a low-risk assessment
        # Assert: Criteria summary shows 0 selected criteria, indicating a low-risk assessment.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[1]/div[2]/div[1]/div[1]/div/span[1]").nth(0)).to_have_text("0", timeout=15000), "Criteria summary shows 0 selected criteria, indicating a low-risk assessment."
        # Assert: Criteria summary displays '/ 9', confirming the score is 0 / 9 (low risk).
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[1]/div[2]/div[1]/div[1]/div/span[2]").nth(0)).to_have_text("/ 9", timeout=15000), "Criteria summary displays '/ 9', confirming the score is 0 / 9 (low risk)."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    