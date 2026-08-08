@echo off
TITLE Cart Rescue AI - Twilio Real-Time Messaging Setup
cls
echo ====================================================================
echo             CART RESCUE AI - TWILIO MESSAGING SETUP
echo ====================================================================
echo.
echo Step 1: Installing Twilio Python SDK...
python -m pip install twilio python-dotenv
echo.

set ENV_FILE=ml-service\.env

if not exist "%ENV_FILE%" (
    echo Creating new ml-service\.env configuration file...
    type nul > "%ENV_FILE%"
)

echo.
echo ====================================================================
echo  CONFIGURE YOUR TWILIO CREDENTIALS FOR REAL-TIME SMS / WHATSAPP
echo ====================================================================
echo  (Press ENTER to use default DEMO SIMULATION mode if you don't have
echo   live keys yet - the app will safely simulate SMS/WhatsApp alerts!)
echo ====================================================================
echo.

set /p SID="Enter Twilio Account SID (or press ENTER for simulation): "
set /p TOKEN="Enter Twilio Auth Token (or press ENTER for simulation): "
set /p FROM_NUM="Enter Twilio From Phone Number (e.g. +18005550199 or whatsapp:+14155238886): "
set /p TO_NUM="Enter Destination Phone Number for Real-Time Alerts (e.g. +919876543210): "

if "%SID%"=="" set SID=AC_YOUR_TWILIO_ACCOUNT_SID_HERE
if "%TOKEN%"=="" set TOKEN=YOUR_TWILIO_AUTH_TOKEN_HERE
if "%FROM_NUM%"=="" set FROM_NUM=+18005550199
if "%TO_NUM%"=="" set TO_NUM=+919876543210

echo.
echo Updating ml-service\.env...

echo TWILIO_ACCOUNT_SID=%SID%>> "%ENV_FILE%"
echo TWILIO_AUTH_TOKEN=%TOKEN%>> "%ENV_FILE%"
echo TWILIO_PHONE_NUMBER=%FROM_NUM%>> "%ENV_FILE%"
echo TWILIO_TO_NUMBER=%TO_NUM%>> "%ENV_FILE%"

echo.
echo ====================================================================
echo              TWILIO SETUP COMPLETED SUCCESSFULLY!
echo ====================================================================
echo  Configured Keys:
echo    - SID:       %SID%
echo    - From:      %FROM_NUM%
echo    - Target To: %TO_NUM%
echo.
echo  The AI pipeline will now dispatch real-time SMS / WhatsApp alerts
echo  whenever a high risk session or payment failure occurs!
echo ====================================================================
echo.
pause
