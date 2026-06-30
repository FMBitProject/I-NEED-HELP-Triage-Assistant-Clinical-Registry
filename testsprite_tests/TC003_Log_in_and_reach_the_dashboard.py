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
        
        # -> Open the Login page by navigating to the application's 'Login' page so the login form becomes visible.
        await page.goto("http://localhost:9002/login")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Fill the Email field with 'testsprite-runner@example.com', fill the Password field with 'TestSprite123!', then click the 'Masuk' button to submit the login form.
        # dokter@puskesmas.id email field
        elem = page.locator('[id="email"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("testsprite-runner@example.com")
        
        # -> Fill the Email field with 'testsprite-runner@example.com', fill the Password field with 'TestSprite123!', then click the 'Masuk' button to submit the login form.
        # •••••••• password field
        elem = page.locator('[id="password"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("TestSprite123!")
        
        # -> Fill the Email field with 'testsprite-runner@example.com', fill the Password field with 'TestSprite123!', then click the 'Masuk' button to submit the login form.
        # Masuk button
        elem = page.get_by_role('button', name='Masuk', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify the dashboard is displayed
        # Assert: The URL contains '/dashboard', confirming the dashboard is displayed.
        await expect(page).to_have_url(re.compile("/dashboard"), timeout=15000), "The URL contains '/dashboard', confirming the dashboard is displayed."
        await page.locator("xpath=/html/body/div[3]/nav/div/div[1]/a[1]").nth(0).scroll_into_view_if_needed()
        # Assert: The top navigation shows the 'Dashboard' link, confirming the dashboard is displayed.
        await expect(page.locator("xpath=/html/body/div[3]/nav/div/div[1]/a[1]").nth(0)).to_be_visible(timeout=15000), "The top navigation shows the 'Dashboard' link, confirming the dashboard is displayed."
        
        # --> Verify personal registry summary content is visible
        await page.locator("xpath=/html/body/div[3]/main/div/div[2]/div[1]/div/div/div").nth(0).scroll_into_view_if_needed()
        # Assert: The 'Total Pasien' summary card is visible.
        await expect(page.locator("xpath=/html/body/div[3]/main/div/div[2]/div[1]/div/div/div").nth(0)).to_be_visible(timeout=15000), "The 'Total Pasien' summary card is visible."
        await page.locator("xpath=/html/body/div[3]/main/div/div[2]/div[2]/div/div/div").nth(0).scroll_into_view_if_needed()
        # Assert: The 'Tingkat Rujukan' summary card is visible.
        await expect(page.locator("xpath=/html/body/div[3]/main/div/div[2]/div[2]/div/div/div").nth(0)).to_be_visible(timeout=15000), "The 'Tingkat Rujukan' summary card is visible."
        await page.locator("xpath=/html/body/div[3]/main/div/div[2]/div[3]/div/div/div").nth(0).scroll_into_view_if_needed()
        # Assert: The 'GDMT Lengkap' summary card is visible.
        await expect(page.locator("xpath=/html/body/div[3]/main/div/div[2]/div[3]/div/div/div").nth(0)).to_be_visible(timeout=15000), "The 'GDMT Lengkap' summary card is visible."
        await page.locator("xpath=/html/body/div[3]/main/div/div[2]/div[4]/div/div/div").nth(0).scroll_into_view_if_needed()
        # Assert: The 'Perlu Follow-up' summary card is visible.
        await expect(page.locator("xpath=/html/body/div[3]/main/div/div[2]/div[4]/div/div/div").nth(0)).to_be_visible(timeout=15000), "The 'Perlu Follow-up' summary card is visible."
        await page.locator("xpath=/html/body/div[3]/main/div/div[5]/div[1]/div[2]/ul/li/a").nth(0).scroll_into_view_if_needed()
        # Assert: A recent patient entry in the 'Pasien Terbaru' list (e.g., TS) is visible.
        await expect(page.locator("xpath=/html/body/div[3]/main/div/div[5]/div[1]/div[2]/ul/li/a").nth(0)).to_be_visible(timeout=15000), "A recent patient entry in the 'Pasien Terbaru' list (e.g., TS) is visible."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    