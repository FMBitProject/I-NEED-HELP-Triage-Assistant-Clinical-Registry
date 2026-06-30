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
        
        # -> Open the application's Login page and load its login form (navigate to the 'Login' page at /login).
        await page.goto("http://localhost:9002/login")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Fill the Email field with testsprite-runner@example.com, fill the Password field with TestSprite123!, and click the 'Masuk' button to sign in.
        # dokter@puskesmas.id email field
        elem = page.locator('[id="email"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("testsprite-runner@example.com")
        
        # -> Fill the Email field with testsprite-runner@example.com, fill the Password field with TestSprite123!, and click the 'Masuk' button to sign in.
        # •••••••• password field
        elem = page.locator('[id="password"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("TestSprite123!")
        
        # -> Fill the Email field with testsprite-runner@example.com, fill the Password field with TestSprite123!, and click the 'Masuk' button to sign in.
        # Masuk button
        elem = page.get_by_role('button', name='Masuk', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Triase Baru' link or the '+ Triase Baru' button on the dashboard to open the new triage form so baseline patient data can be entered.
        # Triase Baru link
        elem = page.get_by_role('link', name='Triase Baru', exact=True)
        await elem.click(timeout=10000)
        
        # -> Fill the required baseline fields: enter patient initial, age, systolic BP, diastolic BP, and heart rate so the form is ready to continue to 'Lanjut ke Skor I-NEED-HELP'.
        # misal: BW text field
        elem = page.locator('[id="initial"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("TS")
        
        # -> Fill the required baseline fields: enter patient initial, age, systolic BP, diastolic BP, and heart rate so the form is ready to continue to 'Lanjut ke Skor I-NEED-HELP'.
        # 65 number field
        elem = page.locator('[id="age"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("65")
        
        # -> Fill the required baseline fields: enter patient initial, age, systolic BP, diastolic BP, and heart rate so the form is ready to continue to 'Lanjut ke Skor I-NEED-HELP'.
        # 120 number field
        elem = page.locator('[id="sbp"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("120")
        
        # -> Fill the required baseline fields: enter patient initial, age, systolic BP, diastolic BP, and heart rate so the form is ready to continue to 'Lanjut ke Skor I-NEED-HELP'.
        # 80 number field
        elem = page.locator('[id="dbp"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("80")
        
        # -> Fill the required baseline fields: enter patient initial, age, systolic BP, diastolic BP, and heart rate so the form is ready to continue to 'Lanjut ke Skor I-NEED-HELP'.
        # 72 number field
        elem = page.locator('[id="hr"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("72")
        
        # -> Select the 'Laki-laki (L)' option for Jenis Kelamin and then click the 'Lanjut ke Skor I-NEED-HELP' button to navigate to the scoring step.
        # Laki-laki (L) button
        elem = page.get_by_role('button', name='Laki-laki (L)', exact=True)
        await elem.click(timeout=10000)
        
        # -> Select the 'Laki-laki (L)' option for Jenis Kelamin and then click the 'Lanjut ke Skor I-NEED-HELP' button to navigate to the scoring step.
        # Lanjut ke Skor I-NEED-HELP button
        elem = page.get_by_role('button', name='Lanjut ke Skor I-NEED-HELP', exact=True)
        await elem.click(timeout=10000)
        
        # -> Select the 'Inotropik IV' worsening-criteria checkbox and then click the 'Lihat Hasil Triase' button to submit and view the triage result page.
        # button
        elem = page.locator('[id="criteria-I"]')
        await elem.click(timeout=10000)
        
        # -> Select the 'Inotropik IV' worsening-criteria checkbox and then click the 'Lihat Hasil Triase' button to submit and view the triage result page.
        # Lihat Hasil Triase button
        elem = page.get_by_role('button', name='Lihat Hasil Triase', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify the triage result is displayed
        # Assert: The I-NEED-HELP score primary value '1' is displayed.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[1]/div[2]/div[1]/div[1]/div/span[1]").nth(0)).to_have_text("1", timeout=15000), "The I-NEED-HELP score primary value '1' is displayed."
        # Assert: The I-NEED-HELP score denominator '/ 9' is displayed.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[1]/div[2]/div[1]/div[1]/div/span[2]").nth(0)).to_have_text("/ 9", timeout=15000), "The I-NEED-HELP score denominator '/ 9' is displayed."
        current_url = await page.evaluate("() => window.location.href")
        # Assert: page loaded with a URL (final outcome verified by the AI judge during the run)
        assert current_url, 'Page should have loaded with a URL'
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    