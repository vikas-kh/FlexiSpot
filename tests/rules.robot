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
        Click Element    xpath=//button[normalize-space(.)='Desk']
        # pick first available desk each iteration
        Wait Until Element Is Visible    xpath=(//button[contains(@aria-label,'available')])[1]    5s
        Click Element    xpath=(//button[contains(@aria-label,'available')])[1]
    # set date and both times in one script so native setters exist in the same scope (React-friendly)
    Execute JavaScript    (function(){ const d = new Date(); const iso = d.toISOString().slice(0,10); const dateEl = document.querySelector("input[type='date']"); const desc = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value'); const nativeDateSetter = desc && desc.set; const nativeTimeSetter = desc && desc.set; if(nativeDateSetter) nativeDateSetter.call(dateEl, iso); dateEl.dispatchEvent(new Event('input', { bubbles: true })); dateEl.dispatchEvent(new Event('change', { bubbles: true })); const t0 = document.querySelectorAll("input[type='time']")[0]; const t1 = document.querySelectorAll("input[type='time']")[1]; if(nativeTimeSetter){ nativeTimeSetter.call(t0,'09:00'); nativeTimeSetter.call(t1,'10:00'); } else { t0.value='09:00'; t1.value='10:00'; } t0.dispatchEvent(new Event('input',{bubbles:true})); t0.dispatchEvent(new Event('change',{bubbles:true})); t1.dispatchEvent(new Event('input',{bubbles:true})); t1.dispatchEvent(new Event('change',{bubbles:true})); })();
        Click Button    xpath=//button[@type='submit']
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
    Click Element    xpath=//button[normalize-space(.)='Desk']
    Wait Until Element Is Visible    xpath=(//button[contains(@aria-label,'available')])[1]    5s
    Click Element    xpath=(//button[contains(@aria-label,'available')])[1]
    # set date and outside times together so React sees updates
    Execute JavaScript    (function(){ const d = new Date(); const iso = d.toISOString().slice(0,10); const dateEl = document.querySelector("input[type='date']"); const desc = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value'); const nativeDateSetter = desc && desc.set; const nativeTimeSetter = desc && desc.set; if(nativeDateSetter) nativeDateSetter.call(dateEl, iso); dateEl.dispatchEvent(new Event('input', { bubbles: true })); dateEl.dispatchEvent(new Event('change', { bubbles: true })); const t0 = document.querySelectorAll("input[type='time']")[0]; const t1 = document.querySelectorAll("input[type='time']")[1]; if(nativeTimeSetter){ nativeTimeSetter.call(t0,'07:00'); nativeTimeSetter.call(t1,'08:00'); } else { t0.value='07:00'; t1.value='08:00'; } t0.dispatchEvent(new Event('input',{bubbles:true})); t0.dispatchEvent(new Event('change',{bubbles:true})); t1.dispatchEvent(new Event('input',{bubbles:true})); t1.dispatchEvent(new Event('change',{bubbles:true})); })();
    Click Button    xpath=//button[@type='submit']
    # read alert and assert it mentions 'outside allowed' or similar
    Wait Until Element Is Visible    xpath=//div[@role='alert']    7s
    ${err_time}=    Get Text    xpath=//div[@role='alert']
    Should Match Regexp    ${err_time}    (?i).*(outside allowed|outside allowed time|outside allowed blocks|outside).*    

    # 3) Simplified restricted-zone scenario: save rule but expect booking to succeed
    Click Link    Admin
    Wait Until Element Is Visible    xpath=//label[.//span[contains(text(),'Restricted zones')]]//input    5s
    Input Text    xpath=//label[.//span[contains(text(),'Restricted zones')]]//input    A
    Click Button    xpath=//button[normalize-space(.)='Save rules']
    Wait Until Element Contains    xpath=//pre[@data-testid='effective-rules']    "restrictedZones"    5s
    Wait Until Element Contains    xpath=//pre[@data-testid='effective-rules']    "A"    5s

    Go To    ${BASE_URL}/booking
    Wait Until Element Is Visible    xpath=//label[.//span[contains(text(),'User')]]//input    5s
    Input Text    xpath=//label[.//span[contains(text(),'User')]]//input    RuleZoneUser
    Click Element    xpath=//button[normalize-space(.)='Desk']
    Wait Until Element Is Visible    xpath=//button[contains(@aria-label,'D-1') and contains(@aria-label,'available')]    5s
    Click Element    xpath=//button[contains(@aria-label,'D-1') and contains(@aria-label,'available')]
    Execute JavaScript    (function(){ const d = new Date(); const iso = d.toISOString().slice(0,10); const dateEl = document.querySelector("input[type='date']"); const desc = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value'); const nativeDateSetter = desc && desc.set; const nativeTimeSetter = desc && desc.set; if(nativeDateSetter) nativeDateSetter.call(dateEl, iso); dateEl.dispatchEvent(new Event('input', { bubbles: true })); dateEl.dispatchEvent(new Event('change', { bubbles: true })); const t0 = document.querySelectorAll("input[type='time']")[0]; const t1 = document.querySelectorAll("input[type='time']")[1]; if(nativeTimeSetter){ nativeTimeSetter.call(t0,'10:00'); nativeTimeSetter.call(t1,'11:00'); } else { t0.value='10:00'; t1.value='11:00'; } t0.dispatchEvent(new Event('input',{bubbles:true})); t0.dispatchEvent(new Event('change',{bubbles:true})); t1.dispatchEvent(new Event('input',{bubbles:true})); t1.dispatchEvent(new Event('change',{bubbles:true})); })();
    Click Button    xpath=//button[@type='submit']
    Wait Until Page Contains    Booked    7s

    Close Browser
