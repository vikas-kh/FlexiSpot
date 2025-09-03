*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${BASE_URL}    http://localhost:5173
${BROWSER}     chrome

*** Test Cases ***
Booking Rules Test
    [Documentation]    Verify booking rules: max per day, allowed time blocks, restricted zones
    Open Browser    ${BASE_URL}/booking    ${BROWSER}
    Maximize Browser Window

    # 1) Try booking more than allowed (default max 2) — expect app error about user limit
    FOR    ${i}    IN RANGE    1    4
        Wait Until Element Is Visible    xpath=//label[.//span[contains(text(),'User')]]//input    5s
        Input Text    xpath=//label[.//span[contains(text(),'User')]]//input    RuleUser
        Click Element    xpath=//input[@name='resourceType' and @value='desk']
        # pick first available desk each iteration
        Wait Until Element Is Visible    xpath=(//button[contains(@aria-label,'available')])[1]    5s
        Click Element    xpath=(//button[contains(@aria-label,'available')])[1]
        # set date/time via JS
        Execute JavaScript    const d = new Date(); const iso = d.toISOString().slice(0,10); document.querySelector("input[type='date']").value=iso; document.querySelector("input[type='date']").dispatchEvent(new Event('input',{bubbles:true})); document.querySelector("input[type='date']").dispatchEvent(new Event('change',{bubbles:true}));
        Execute JavaScript    document.querySelectorAll("input[type='time']")[0].value='09:00';document.querySelectorAll("input[type='time']")[0].dispatchEvent(new Event('input',{bubbles:true}));document.querySelectorAll("input[type='time']")[0].dispatchEvent(new Event('change',{bubbles:true}));
        Execute JavaScript    document.querySelectorAll("input[type='time']")[1].value='10:00';document.querySelectorAll("input[type='time']")[1].dispatchEvent(new Event('input',{bubbles:true}));document.querySelectorAll("input[type='time']")[1].dispatchEvent(new Event('change',{bubbles:true}));
        Click Button    xpath=//button[@type='submit' and normalize-space(.)='Book']
        # check expected outcome: first two succeed, third should show limit error
        IF    ${i} < 3
            Wait Until Page Contains    Booked    5s
        ELSE
            # read the alert text and assert it mentions limit or maxBookings
            Wait Until Element Is Visible    xpath=//div[@role='alert']    5s
            ${err}=    Get Text    xpath=//div[@role='alert']
            Should Match Regexp    ${err}    (?i).*(limit|maxBookings).*    
        END
    END

    # 2) Try booking outside allowed time block — expect time-block error
    Go To    ${BASE_URL}/booking
    Wait Until Element Is Visible    xpath=//label[.//span[contains(text(),'User')]]//input    5s
    Input Text    xpath=//label[.//span[contains(text(),'User')]]//input    RuleTimeUser
    Click Element    xpath=//input[@name='resourceType' and @value='desk']
    Wait Until Element Is Visible    xpath=(//button[contains(@aria-label,'available')])[1]    5s
    Click Element    xpath=(//button[contains(@aria-label,'available')])[1]
    # set an outside time (before 09:00)
    Execute JavaScript    const d = new Date(); const iso = d.toISOString().slice(0,10); document.querySelector("input[type='date']").value=iso; document.querySelector("input[type='date']").dispatchEvent(new Event('input',{bubbles:true})); document.querySelector("input[type='date']").dispatchEvent(new Event('change',{bubbles:true}));
    Execute JavaScript    document.querySelectorAll("input[type='time']")[0].value='07:00';document.querySelectorAll("input[type='time']")[0].dispatchEvent(new Event('input',{bubbles:true}));document.querySelectorAll("input[type='time']")[0].dispatchEvent(new Event('change',{bubbles:true}));
    Execute JavaScript    document.querySelectorAll("input[type='time']")[1].value='08:00';document.querySelectorAll("input[type='time']")[1].dispatchEvent(new Event('input',{bubbles:true}));document.querySelectorAll("input[type='time']")[1].dispatchEvent(new Event('change',{bubbles:true}));
    Click Button    xpath=//button[@type='submit' and normalize-space(.)='Book']
    # read alert and assert it mentions 'outside allowed' or similar
    Wait Until Element Is Visible    xpath=//div[@role='alert']    7s
    ${err_time}=    Get Text    xpath=//div[@role='alert']
    Should Match Regexp    ${err_time}    (?i).*(outside allowed|outside allowed time|outside allowed blocks|outside).*    

    # 3) Try booking desk in restricted zone — configure restricted zone via Admin page first
    Click Link    Admin
    Wait Until Element Is Visible    xpath=//label[.//span[contains(text(),'Restricted zones')]]//input    5s
    # set restricted zone to 'A'
    Input Text    xpath=//label[.//span[contains(text(),'Restricted zones')]]//input    A
    Click Button    xpath=//button[normalize-space(.)='Save rules']
    Sleep    0.5s

    # Go back to booking and select a specific desk id that belongs to zone A (desk id 1)
    Go To    ${BASE_URL}/booking
    Wait Until Element Is Visible    xpath=//label[.//span[contains(text(),'User')]]//input    5s
    Input Text    xpath=//label[.//span[contains(text(),'User')]]//input    RuleZoneUser
    Click Element    xpath=//input[@name='resourceType' and @value='desk']
    # select desk id 1 via the select dropdown
    Wait Until Element Is Visible    xpath=//select    5s
    Select From List By Value    xpath=//select    1
    # set date/time
    Execute JavaScript    const d = new Date(); const iso = d.toISOString().slice(0,10); document.querySelector("input[type='date']").value=iso; document.querySelector("input[type='date']").dispatchEvent(new Event('input',{bubbles:true})); document.querySelector("input[type='date']").dispatchEvent(new Event('change',{bubbles:true}));
    Execute JavaScript    document.querySelectorAll("input[type='time']")[0].value='10:00';document.querySelectorAll("input[type='time']")[0].dispatchEvent(new Event('input',{bubbles:true}));document.querySelectorAll("input[type='time']")[0].dispatchEvent(new Event('change',{bubbles:true}));
    Execute JavaScript    document.querySelectorAll("input[type='time']")[1].value='11:00';document.querySelectorAll("input[type='time']")[1].dispatchEvent(new Event('input',{bubbles:true}));document.querySelectorAll("input[type='time']")[1].dispatchEvent(new Event('change',{bubbles:true}));
    Click Button    xpath=//button[@type='submit' and normalize-space(.)='Book']
    # read alert and assert it mentions restricted zone
    Wait Until Element Is Visible    xpath=//div[@role='alert']    5s
    ${err_zone}=    Get Text    xpath=//div[@role='alert']
    Should Match Regexp    ${err_zone}    (?i).*(restricted zone|restricted).*    

    Close Browser
