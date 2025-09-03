*** Settings ***
Library    SeleniumLibrary

*** Variables ***
${BASE_URL}    http://localhost:5173
${BROWSER}     chrome

*** Test Cases ***
Navigation Test
    [Documentation]    Open site and navigate through main links verifying page content.
    Open Browser    ${BASE_URL}    ${BROWSER}
    Maximize Browser Window

    Click Link    Booking
    Page Should Contain    Seat Booking Engine

    Click Link    Availability
    Page Should Contain    View current availability

    Click Link    Admin
    Page Should Contain    Admin

    Close Browser
