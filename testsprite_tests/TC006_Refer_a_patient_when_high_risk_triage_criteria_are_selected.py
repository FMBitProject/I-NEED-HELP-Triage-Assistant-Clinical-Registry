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
        
        # -> Fill the email field with testsprite-runner@example.com and the password field with TestSprite123!, then click the 'Masuk' button to submit the login form.
        # dokter@puskesmas.id email field
        elem = page.locator('[id="email"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("testsprite-runner@example.com")
        
        # -> Fill the email field with testsprite-runner@example.com and the password field with TestSprite123!, then click the 'Masuk' button to submit the login form.
        # •••••••• password field
        elem = page.locator('[id="password"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("TestSprite123!")
        
        # -> Fill the email field with testsprite-runner@example.com and the password field with TestSprite123!, then click the 'Masuk' button to submit the login form.
        # Masuk button
        elem = page.get_by_role('button', name='Masuk', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Triase Baru' button on the Dashboard to open the new triage form.
        # Triase Baru Triase button
        elem = page.get_by_role('button', name='Triase Baru Triase', exact=True)
        await elem.click(timeout=10000)
        
        # -> Fill the patient's initial, age, systolic BP, diastolic BP, and heart rate fields so the baseline profile is mostly complete (then set gender and proceed in the next step).
        # misal: BW text field
        elem = page.locator('[id="initial"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("TS")
        
        # -> Fill the patient's initial, age, systolic BP, diastolic BP, and heart rate fields so the baseline profile is mostly complete (then set gender and proceed in the next step).
        # 65 number field
        elem = page.locator('[id="age"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("70")
        
        # -> Fill the patient's initial, age, systolic BP, diastolic BP, and heart rate fields so the baseline profile is mostly complete (then set gender and proceed in the next step).
        # 120 number field
        elem = page.locator('[id="sbp"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("120")
        
        # -> Fill the patient's initial, age, systolic BP, diastolic BP, and heart rate fields so the baseline profile is mostly complete (then set gender and proceed in the next step).
        # 80 number field
        elem = page.locator('[id="dbp"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("80")
        
        # -> Fill the patient's initial, age, systolic BP, diastolic BP, and heart rate fields so the baseline profile is mostly complete (then set gender and proceed in the next step).
        # 72 number field
        elem = page.locator('[id="hr"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("90")
        
        # -> Select the patient's gender by clicking the 'Laki-laki (L)' button, then click the 'Lanjut ke Skor I-NEED-HELP' button to proceed to the scoring checklist.
        # Laki-laki (L) button
        elem = page.get_by_role('button', name='Laki-laki (L)', exact=True)
        await elem.click(timeout=10000)
        
        # -> Select the patient's gender by clicking the 'Laki-laki (L)' button, then click the 'Lanjut ke Skor I-NEED-HELP' button to proceed to the scoring checklist.
        # Lanjut ke Skor I-NEED-HELP button
        elem = page.get_by_role('button', name='Lanjut ke Skor I-NEED-HELP', exact=True)
        await elem.click(timeout=10000)
        
        # -> Select the 'Low BP & High HR' triage criterion and then click the 'Lihat Hasil Triase' button to submit and view the triage result page.
        # button
        elem = page.locator('[id="criteria-L"]')
        await elem.click(timeout=10000)
        
        # -> Select the 'Low BP & High HR' triage criterion and then click the 'Lihat Hasil Triase' button to submit and view the triage result page.
        # Lihat Hasil Triase button
        elem = page.get_by_role('button', name='Lihat Hasil Triase', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify the referral recommendation is visible
        await page.locator("xpath=/html/body/div[2]/main/div/div[4]/div/div/div[1]/span").nth(0).scroll_into_view_if_needed()
        # Assert: The referral recommendation icon (ambulance) is visible on the result page.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[4]/div/div/div[1]/span").nth(0)).to_be_visible(timeout=15000), "The referral recommendation icon (ambulance) is visible on the result page."
        
        # --> Verify the triage score is displayed
        # Assert: Triage score numerator '1' is displayed.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[1]/div[2]/div[1]/div[1]/div/span[1]").nth(0)).to_have_text("1", timeout=15000), "Triage score numerator '1' is displayed."
        # Assert: Triage score denominator '/ 9' is displayed.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[1]/div[2]/div[1]/div[1]/div/span[2]").nth(0)).to_have_text("/ 9", timeout=15000), "Triage score denominator '/ 9' is displayed."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    