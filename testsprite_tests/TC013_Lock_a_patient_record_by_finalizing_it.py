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
        
        # -> Open the 'Login' page by navigating to the application's /login URL (the Login page).
        await page.goto("http://localhost:9002/login")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Fill the email field with testsprite-runner@example.com, fill the password field with TestSprite123!, then click the 'Masuk' (Login) button to submit the form.
        # dokter@puskesmas.id email field
        elem = page.locator('[id="email"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("testsprite-runner@example.com")
        
        # -> Fill the email field with testsprite-runner@example.com, fill the password field with TestSprite123!, then click the 'Masuk' (Login) button to submit the form.
        # •••••••• password field
        elem = page.locator('[id="password"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("TestSprite123!")
        
        # -> Fill the email field with testsprite-runner@example.com, fill the password field with TestSprite123!, then click the 'Masuk' (Login) button to submit the form.
        # Masuk button
        elem = page.get_by_role('button', name='Masuk', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Pasien' link in the top navigation to open the patient registry (patient list).
        # Pasien link
        elem = page.get_by_role('link', name='Pasien', exact=True)
        await elem.click(timeout=10000)
        
        # -> Open the patient record labeled 'TS' by clicking the patient row with the visible text 'TS'.
        # TS TS 67 th • L Rujuk TD: 100 / 65 HR: 98 EF: 32... link
        elem = page.get_by_role('link', name='TS TS 67th • L Rujuk TD: 100/65 HR: 98 EF: 32% GDMT: 2/4 29 Jun 2026', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Finalisasi' (Finalize) button in the patient detail view to begin finalizing the record.
        # Finalisasi button
        elem = page.get_by_role('button', name='Finalisasi', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Ya, Finalisasi' (Yes, Finalize) button in the confirmation dialog to finalize (lock) the patient record.
        # Ya, Finalisasi button
        elem = page.get_by_role('button', name='Ya, Finalisasi', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify the record is locked from further edits
        await page.locator("xpath=/html/body/div[2]/main/div/div[1]/a/button").nth(0).scroll_into_view_if_needed()
        # Assert: The page shows a 'Buka Kunci' button indicating the record is locked.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[1]/a/button").nth(0)).to_be_visible(timeout=15000), "The page shows a 'Buka Kunci' button indicating the record is locked."
        await page.locator("xpath=/html/body/div[2]/main/div/div[2]/div[2]/div[2]/a/button").nth(0).scroll_into_view_if_needed()
        # Assert: The page shows a 'Minta Ubah Data' button, confirming the record is finalized and locked from baseline edits.
        await expect(page.locator("xpath=/html/body/div[2]/main/div/div[2]/div[2]/div[2]/a/button").nth(0)).to_be_visible(timeout=15000), "The page shows a 'Minta Ubah Data' button, confirming the record is finalized and locked from baseline edits."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    