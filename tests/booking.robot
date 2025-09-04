*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${BASE_URL}    http://localhost:5173
${BROWSER}     chrome
${TODAY}       Evaluate    __import__('datetime').date.today().isoformat()    None

*** Test Cases ***
Seat Booking Test
    [Documentation]    Book a desk as TestUser for today 10:00-11:00
    Open Browser    ${BASE_URL}/booking    ${BROWSER}
    Maximize Browser Window

    Wait Until Element Is Visible    xpath=//label[.//span[contains(text(),'User')]]//input    5s
    Input Text    xpath=//label[.//span[contains(text(),'User')]]//input    TestUser

    Click Element    xpath=//button[normalize-space(.)='Desk']

    # Click the first available desk in the seat map
    Wait Until Element Is Visible    xpath=(//button[contains(@aria-label,'available')])[1]    5s
    Click Element    xpath=(//button[contains(@aria-label,'available')])[1]

    # Some browsers don't accept direct typing for date/time inputs reliably.
    # Set today's date via JS to avoid quoting/format issues
    Execute JavaScript    const d = new Date(); const iso = d.toISOString().slice(0,10); document.querySelector("input[type='date']").value=iso; document.querySelector("input[type='date']").dispatchEvent(new Event('input',{bubbles:true})); document.querySelector("input[type='date']").dispatchEvent(new Event('change',{bubbles:true}));
    Execute JavaScript    document.querySelectorAll("input[type='time']")[0].value='10:00';document.querySelectorAll("input[type='time']")[0].dispatchEvent(new Event('input',{bubbles:true}));document.querySelectorAll("input[type='time']")[0].dispatchEvent(new Event('change',{bubbles:true}));
    Execute JavaScript    document.querySelectorAll("input[type='time']")[1].value='11:00';document.querySelectorAll("input[type='time']")[1].dispatchEvent(new Event('input',{bubbles:true}));document.querySelectorAll("input[type='time']")[1].dispatchEvent(new Event('change',{bubbles:true}));

    Click Button    xpath=//button[@type='submit']

    # App shows: "Booked <resourceType> <id> for <user>." — assert booked message and username
    Wait Until Page Contains    Booked    7s
    Wait Until Page Contains    TestUser    7s

    Close Browser
