*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${BASE_URL}    http://localhost:5173
${BROWSER}     chrome

*** Test Cases ***
Real-Time Availability Test
    [Documentation]    Book a desk then verify it's marked booked on Availability page
    Open Browser    ${BASE_URL}/booking    ${BROWSER}
    Maximize Browser Window

    Wait Until Element Is Visible    xpath=//label[.//span[contains(text(),'User')]]//input    5s
    Input Text    xpath=//label[.//span[contains(text(),'User')]]//input    AvailTester

    Click Element    xpath=//input[@name='resourceType' and @value='desk']

    # Find and remember the first available desk's label, then click it
    Wait Until Element Is Visible    xpath=(//button[contains(@aria-label,'available')])[1]    5s
    ${deskLabel}=    Get Text    xpath=(//button[contains(@aria-label,'available')])[1]
    Click Element    xpath=(//button[contains(@aria-label,'available')])[1]

    # Set date/time using JS (reliable)
    Execute JavaScript    const d = new Date(); const iso = d.toISOString().slice(0,10); document.querySelector("input[type='date']").value=iso; document.querySelector("input[type='date']").dispatchEvent(new Event('input',{bubbles:true})); document.querySelector("input[type='date']").dispatchEvent(new Event('change',{bubbles:true}));
    Execute JavaScript    document.querySelectorAll("input[type='time']")[0].value='10:00';document.querySelectorAll("input[type='time']")[0].dispatchEvent(new Event('input',{bubbles:true}));document.querySelectorAll("input[type='time']")[0].dispatchEvent(new Event('change',{bubbles:true}));
    Execute JavaScript    document.querySelectorAll("input[type='time']")[1].value='11:00';document.querySelectorAll("input[type='time']")[1].dispatchEvent(new Event('input',{bubbles:true}));document.querySelectorAll("input[type='time']")[1].dispatchEvent(new Event('change',{bubbles:true}));

    Click Button    xpath=//button[@type='submit' and normalize-space(.)='Book']

    # Wait until booking confirmation appears
    Wait Until Page Contains    Booked    7s
    Wait Until Page Contains    AvailTester    7s

    # Go to availability page (click link to preserve SPA routing)
    Click Link    Availability

    # Ensure the previously booked desk is now marked 'booked' (aria-label contains 'booked')
    ${expectedAria}=    Set Variable    booked
    Wait Until Element Is Visible    xpath=//button[contains(.,"${deskLabel}") and contains(@aria-label, '${expectedAria}')]    7s

    Close Browser
