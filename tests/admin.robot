*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${BASE_URL}    http://localhost:5173
${BROWSER}     chrome

*** Test Cases ***
Verify Admin Page Loads
    [Documentation]    Open the admin page and verify it contains "Admin"
    Open Browser    ${BASE_URL}/admin    ${BROWSER}
    Maximize Browser Window
    Wait Until Page Contains    Admin    10s
    Capture Page Screenshot
    Close Browser

Verify Desk Availability Toggle
    [Documentation]    Verify toggling desk availability works correctly for desk labeled 'D-1' using JS click fallback
    Open Browser    ${BASE_URL}/admin    ${BROWSER}
    Maximize Browser Window
    Wait Until Page Contains    Admin    10s
    # Try to read the button text for the D-1 row using JS (returns null if not found)
    ${before}=    Execute JavaScript    return (function(){ const nodes = Array.from(document.querySelectorAll('div')); const target = nodes.find(n => n.innerText && n.innerText.trim().startsWith('D-1')); if(!target) return null; const btn = target.querySelector('button'); return btn ? btn.innerText.trim() : null; })();
    Should Not Be Empty    ${before}
    # Click the button via JS (bypassing visibility issues)
    Execute JavaScript    (function(){ const nodes = Array.from(document.querySelectorAll('div')); const target = nodes.find(n => n.innerText && n.innerText.trim().startsWith('D-1')); if(!target) return false; const btn = target.querySelector('button'); if(!btn) return false; btn.click(); return true; })();
    Sleep    0.5s
    ${after}=    Execute JavaScript    return (function(){ const nodes = Array.from(document.querySelectorAll('div')); const target = nodes.find(n => n.innerText && n.innerText.trim().startsWith('D-1')); if(!target) return null; const btn = target.querySelector('button'); return btn ? btn.innerText.trim() : null; })();
    Should Not Be Empty    ${after}
    Should Not Be Equal    ${before}    ${after}
    Capture Page Screenshot
    Close Browser