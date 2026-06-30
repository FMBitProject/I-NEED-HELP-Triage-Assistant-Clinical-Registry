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
        
        # -> Fill the Email field with 'testsprite-runner@example.com', fill the Password field with 'TestSprite123!', then click the 'Masuk' (Login) button to sign in.
        # dokter@puskesmas.id email field
        elem = page.locator('[id="email"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("testsprite-runner@example.com")
        
        # -> Fill the Email field with 'testsprite-runner@example.com', fill the Password field with 'TestSprite123!', then click the 'Masuk' (Login) button to sign in.
        # •••••••• password field
        elem = page.locator('[id="password"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("TestSprite123!")
        
        # -> Fill the Email field with 'testsprite-runner@example.com', fill the Password field with 'TestSprite123!', then click the 'Masuk' (Login) button to sign in.
        # Masuk button
        elem = page.get_by_role('button', name='Masuk', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the blue 'Triase Baru' (New Triage) button on the Dashboard to start a new triage.
        # Triase Baru Triase button
        elem = page.get_by_role('button', name='Triase Baru Triase', exact=True)
        await elem.click(timeout=10000)
        
        # -> Fill the patient profile: enter initials 'BW', set age to '65', choose gender 'Laki-laki (L)', and enter systolic '120' and diastolic '80' in the Vital Signs section.
        # misal: BW text field
        elem = page.locator('[id="initial"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("BW")
        
        # -> Fill the patient profile: enter initials 'BW', set age to '65', choose gender 'Laki-laki (L)', and enter systolic '120' and diastolic '80' in the Vital Signs section.
        # 65 number field
        elem = page.locator('[id="age"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("65")
        
        # -> Fill the patient profile: enter initials 'BW', set age to '65', choose gender 'Laki-laki (L)', and enter systolic '120' and diastolic '80' in the Vital Signs section.
        # Laki-laki (L) button
        elem = page.get_by_role('button', name='Laki-laki (L)', exact=True)
        await elem.click(timeout=10000)
        
        # -> Fill the patient profile: enter initials 'BW', set age to '65', choose gender 'Laki-laki (L)', and enter systolic '120' and diastolic '80' in the Vital Signs section.
        # 120 number field
        elem = page.locator('[id="sbp"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("120")
        
        # -> Fill the patient profile: enter initials 'BW', set age to '65', choose gender 'Laki-laki (L)', and enter systolic '120' and diastolic '80' in the Vital Signs section.
        # 80 number field
        elem = page.locator('[id="dbp"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("80")
        
        # -> Fill the heart rate and LVEF fields, select the 'Hipertensi' comorbidity, then click the 'Lanjut ke Skor I-NEED-HELP' button to move to the scoring step.
        # 72 number field
        elem = page.locator('[id="hr"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("72")
        
        # -> Fill the heart rate and LVEF fields, select the 'Hipertensi' comorbidity, then click the 'Lanjut ke Skor I-NEED-HELP' button to move to the scoring step.
        # 45 number field
        elem = page.locator('[id="lvef"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("45")
        
        # -> Fill the heart rate and LVEF fields, select the 'Hipertensi' comorbidity, then click the 'Lanjut ke Skor I-NEED-HELP' button to move to the scoring step.
        # button
        elem = page.locator('[id="htn"]')
        await elem.click(timeout=10000)
        
        # -> Fill the heart rate and LVEF fields, select the 'Hipertensi' comorbidity, then click the 'Lanjut ke Skor I-NEED-HELP' button to move to the scoring step.
        # Lanjut ke Skor I-NEED-HELP button
        elem = page.get_by_role('button', name='Lanjut ke Skor I-NEED-HELP', exact=True)
        await elem.click(timeout=10000)
        
        # -> Select the 'Inotropik IV' deterioration criterion on the I-NEED-HELP page, then click the 'Lihat Hasil Triase' button to submit and view the final score and recommendation.
        # button
        elem = page.locator('[id="criteria-I"]')
        await elem.click(timeout=10000)
        
        # -> Select the 'Inotropik IV' deterioration criterion on the I-NEED-HELP page, then click the 'Lihat Hasil Triase' button to submit and view the final score and recommendation.
        # Lihat Hasil Triase button
        elem = page.get_by_role('button', name='Lihat Hasil Triase', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify the triage result is displayed
        # Assert: The final I-NEED-HELP score numerator '1' is visible.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[1]/div[2]/div[1]/div[1]/div/span[1]").nth(0)).to_have_text("1", timeout=15000), "The final I-NEED-HELP score numerator '1' is visible."
        # Assert: The final I-NEED-HELP score denominator '/ 9' is visible.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[1]/div[2]/div[1]/div[1]/div/span[2]").nth(0)).to_have_text("/ 9", timeout=15000), "The final I-NEED-HELP score denominator '/ 9' is visible."
        # Assert: The selected I-NEED-HELP criterion 'I' is shown on the result page.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[2]/div/div/div/span").nth(0)).to_have_text("I", timeout=15000), "The selected I-NEED-HELP criterion 'I' is shown on the result page."
        
        # --> Verify a final score and recommendation are displayed
        # Assert: Final I-NEED-HELP score numerator '1' is displayed.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[1]/div[2]/div[1]/div[1]/div/span[1]").nth(0)).to_have_text("1", timeout=15000), "Final I-NEED-HELP score numerator '1' is displayed."
        # Assert: Final I-NEED-HELP score denominator '/ 9' is displayed.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[1]/div[2]/div[1]/div[1]/div/span[2]").nth(0)).to_have_text("/ 9", timeout=15000), "Final I-NEED-HELP score denominator '/ 9' is displayed."
        await page.locator("xpath=/html/body/div[2]/main/div/div[4]/div/div/div[1]/span").nth(0).scroll_into_view_if_needed()
        # Assert: Clinical recommendation section icon (🚑) is visible, indicating a recommendation is displayed.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[4]/div/div/div[1]/span").nth(0)).to_be_visible(timeout=15000), "Clinical recommendation section icon (\ud83d\ude91) is visible, indicating a recommendation is displayed."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    