# Robot T200/T400 demo server - Version 2
The demo server demonstrates the capabilities of the Radical ES Robot Packhouse terminal. It implements the full set of the [Robot API](api/robot-api.md). It show how to response to a Robot configuration request and regular pings. 
This is a reworked version from the original, which was mainly written for test purposes.

## Status!
Very much still a work in progress :)
Add TypeScript & Prisma to the project

## Variants
|Robot-T200|Robot-T201|Robot-T202|Robot-T203|
|:---:|:---:|:---:|:---:|
|<img src="images/rbt200.jpg" alt="Robot-T200" title="Robot T200 Keypad" width="200" />|<img src="images/rbt201.png" alt="Robot-T201" title="Robot T201 Keypad" width="200" />|<img src="images/rbt202.png" alt="Robot-T202" title="Robot T202 Keypad" width="200" />|<img src="images/rbt203.png" alt="Robot-T203" title="Robot T203 Keypad" width="200" />|


## Future Support
* Android version
* Robot-T420 QT application support

## Implementation Supported
* Packer Terminals
* Pallet Scales
* Scanner Stations
* QC Points
* Forklift Pallet Movement
* Bin Tip and Intakes
* On Demand Label Printing
* Time and Attendance

## To get up and running
1. Install NodeJS
2. Clone the repo
3. run npm install & npm start
4. Configure server with robot in [Server Configuration](config.json)
5. Connect your Robot to the same LAN and fillout the Setup URL with the server IP and port

## Further Development
We are in the process of adding support for the following:
* Fuel Dispensing - Prowalco Dispensors
* Chemicals Dispensing - Farm related activities