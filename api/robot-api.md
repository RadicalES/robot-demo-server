# Robot Application Program Interface


## Introduction
The Robot API uses HTTP to generate transactions via the POST verb on a single URI.
Transactions are request-response based with a named action in the payload.

A Payload is in JSON format and is contained in the body of the HTTP transaction.
Each payload contains a single named JSON object. The name of the
object is the command to interpret with the object contents as its parameters.

Basic format of the payload is as follows:

```JSON
{
    "requestCommand" : {
        "param1" : "data1",
        "param2" : "data2"
    }
}
```

## Architecture
Communications is based on a client-server topology and this is implemented bidirectionally, the server and the Robot. Not all commands are supported by both ends.

The Robot requires a boot configuration that is supplied by a configuration- server. There after communications continue on a transaction-server. Splitting concerns for configuration and transaction is not necessary on smaller installations.

Robots and their API is designed to run at scale with zero network administration requirements. A server configuration provider can reboot or reconfigure a Robot or cluster of Robots at will. Network parameters or application settings can be changed at run time.

## Robot Operations
Basic purpose of the Robot is to link packhouse floor operations to IT systems in a deterministic manner. A LCD screen, LEDs & Buttons provide user interaction. One or two scanners can be attached for QC or palletizing purposes. Or a scale and scanner for SOLAS scales. The Robot and its API provide a single point and consistent solution to real world requirements in packhouses. It make it easy for IT systems to connect various operations in packhouses in a simplistic manner. The Robot provides a specified bridge between packhouse floor operations and IT systems.

## Server Discovery

The Robot discovers the SCADA server using multiple methods in priority order:

### 1. DHCP Optional Parameters
The Robot supports additional DHCP scope parameters while acquiring its leased address. Two additional parameters can be included specifying an IP address and port which can provide its runtime configuration.

|Scope Name|Value|Type|Example|
|:---:|:---:|:---:|:---:|
|Robot Server Ip Address|182|4 byte ip address|192.168.1.100|
|Robot Server Port|183|16-bit number|8080|

### 2. mDNS Discovery (Fallback)
When DHCP options are not configured, the Robot can discover the server via mDNS (multicast DNS / Avahi). The server advertises itself as `_robot-scada._tcp.local` on the local network. The Robot queries for this service and receives the server IP, HTTP port, and MQTT port.

See [Device Discovery via mDNS](../device-discovery-mdns.md) for setup instructions.

### 3. Local Configuration
If neither DHCP nor mDNS provides a server address, the Robot uses the locally stored URL configured via its web GUI.

### Discovery Priority
1. **DHCP option 182/183** - if the network admin has configured it, use it (fastest)
2. **mDNS discovery** - query `_robot-scada._tcp.local` on the local network
3. **Local storage** - use previously stored URL from web GUI or last successful discovery

### Boot Setup Request URL
The Robot setup request URL is fixed and assembled from the discovered IP address and port. A server will need to listen at that endpoint and either provide the URL of the next setup server, or provide a full runtime setup to the Robot.

#### Assembled URL format
http://[server-ip]:[port]/robot/api/setup/?boot=true

### Diagram of boot process
<img src="../images/robot-boot-dhcp.png" alt="Robot-DHCP-Boot" title="Robot DHCP Boot Process" width="600" />

#### The boot process
1. The Robot will look for optional DHCP parameters 182 & 183.
2. If not found, the Robot queries mDNS for `_robot-scada._tcp.local`.
3. If found via either method it will contact the server with a *requestSetup* packet.
4. The response can be *responseSetup* or *responseSetupURL*.
5. *responseSetup* must provide a full setup for the Robot to operate from.
6. *responseSetupURL* only has a URL to a contactable resource that must provide a complete runtime setup.
7. In the case where no server is discovered, the Robot will use the locally stored URL, set via its web GUI, as the location to contact for a runtime setup.

<details><summary>Basic Command Structure</summary>

<p>

## Payload Layout
All payloads has exactly one command and one object. The object contains the parameters associated with the command. A MAC address must always be present in the object.

### Basic command layout
Below is the basic payload command structure.
```JSON
{
    "payloadCommand" : {
        "MAC" : "AA:BB:CC:00:11:22",
        "parameterName" : "parameterValue"
    }
}
```

### Reset Command
The server can respond with reset to any command to trigger a reboot on the Robot
```JSON
{
    "requestReset" : {
        "MAC" : "AA:BB:CC:00:11:22"
    }
}
```

</p>
</details>

<details><summary>Informative Commands</summary>
Information request commands are send to the device and the response provides details of the device.
<p>

## Information Request
A request contains the MAC address of the device and must match to get a valid response.
```JSON
{
    "requestInformation" : {
        "MAC" : "AA:BB:CC:00:11:22"
    }
}
```

### Information Response
The response contains the hardware and software versions. The type describes the device and uptime is the running time in seconds.
```JSON
{
    "responseInformation" : {
        "MAC" : "AA:BB:CC:00:11:22",
        "hardware" : "1a",
        "software" : "1.0.1",
        "type"     : "ROBOT-T201",
        "uptime"   : "1000"
    }
}
```

### Status Request
Status request can be send to get the current state of the device. Generally the device will send a status update once it booted. The MAC address is a required object parameter and must match the device address.

```JSON
{
    "requestStatus" : {
        "MAC" : "AA:BB:CC:00:11:22"
    }
}
```

### Status Response
Upon boot up or specifically requested the device will publish its status as follows:
```JSON
{
    "publishStatus" : {
        "status" : "READY/!READY",
        "system" : "ENGINE/SCALE/SCANNER",
        "message" : "Descriptive message when in error",
        "MAC" : "AA:BB:CC:00:11:22",
        "session" : "0123456789abcdef"
    }
}
```

</p>
</details>

<details><summary>General Commands</summary>
General commands include, reset, ping and date-time.
<p>

### Ping-Pong
The Robot will continuously ping the server to make sure the network is functional and the server is operational. Upon a Ping command the server should respond with a Pong. A reset response can also be sent to reboot the Robot.

#### Ping Request
```JSON
{
    "requestPing" : {
        "MAC" : "AA:BB:CC:00:11:22"
    }
}
```
#### Pong Response
```JSON
{
  "responsePong": {
    "MAC": "AA:BB:CC:00:11:22"
  }
}
```

### Date Time
The Robot can request the current time and date.

#### Date & Time Request
```JSON
{
    "requestDateTime" : {
        "MAC"  : "AA:BB:CC:00:11:22"
    }
}
```
#### Date & Time Response
```JSON
{
    "responseDateTime" : {
        "status" : "OK/FAIL/ERROR",
        "MAC" : "AA:BB:CC:00:11:22",
        "date" : "yyyy-mm-dd",
        "time" : "12:00:00"
    }
}
```

### Reset Command
The reset request can be a response to any command request from the Robot. When an invalid setup is detected or when the server wishes to cycle a new configuration request the Robot can simply reboot.
```JSON
{
    "requestReset" : {
        "MAC" : "AA:BB:CC:00:11:22"
    }
}
```

</p>
</details>

<details><summary>Robot Configuration</summary>
On boot the server must provide important information to the Robot. Various settings and the application type as well as the transaction server URL must be specified.
<p>

### Robot Request Setup
The Robot sends its MAC address, device type, and status. Optional fields include device info and network addresses used by the server for remote access.

```JSON
{
    "requestSetup" : {
        "MAC" : "AA:BB:CC:00:11:22",
        "type" : "SOLAS-Scale",
        "status" : "REQUEST",
        "platform" : "ESP32",
        "model" : "ROBOT-T202-4BTN",
        "firmware" : "2.3.0",
        "controlURL" : "http://192.168.1.50:80/",
        "clientURL" : "http://192.168.1.50:80/",
        "VNC" : "192.168.1.50:5900"
    }
}
```

| Field | Required | Description |
|---|---|---|
| MAC | Yes | Device MAC address |
| type | Yes | Device application type |
| status | Yes | `REQUEST` or `ACCEPT` (see below) |
| platform | No | Hardware platform (e.g. "ESP32") |
| model | No | Device model name (e.g. "ROBOT-T202-4BTN"). Used to auto-select the RobotType on the server. Supports prefix matching (e.g. "ROBOT-T430-VNC-RFID" matches RobotType "ROBOT-T430") |
| firmware | No | Current firmware version string |
| controlURL | No | Device HTTP control URL. Server extracts IP address from this |
| clientURL | No | Alternative to controlURL, same behaviour |
| VNC | No | VNC address as "IP:port". Server saves IP and VNC port for remote access |

#### Setup Status Values

**`REQUEST`** — Device is requesting its configuration. The server responds with a full `responseSetup` containing all runtime settings and a new session ID.

**`ACCEPT`** — Device is acknowledging that it received and applied the configuration. This is purely informational. The server saves any device info (controlURL, platform, model, firmware) but does **not** resend the full configuration. The response is a simple acknowledgment:

```JSON
{
    "responseSetup" : {
        "MAC" : "AA:BB:CC:00:11:22",
        "status" : "OK"
    }
}
```

### Server Response Setup
Full runtime configuration for the Robot. The exact set of fields depends on the
**device family**, because a T200-series terminal and a Linux terminal (T400 /
T500 / ITPC) have very different capabilities.

#### serverURL vs transactionURL
`serverURL` is the **configuration** endpoint (where the Robot boots and requests
its setup). `transactionURL` is the **transaction** endpoint (where the Robot
posts its `publish*` transactions). On a small installation one server does both
and `transactionURL` is omitted — transactions go to `serverURL`. In a **split
system** the two are separated, and `transactionURL` may point at a **third
party** where the transaction actually happens. This split applies to **every
device family, including the T200** — it is a property of ROBOT-API, not of the
device. When that third-party endpoint is protected, `security` is `SECURE` and
the Robot signs on with `signOnUsername`/`signOnPassword`.

#### Base fields (all devices)
MQTT fields are only included when MQTT is configured for the robot's
configuration profile.

| Field | Description |
|---|---|
| MAC | Device MAC address (always echoed back) |
| status | `ENABLED` or `DISABLED` |
| lowLimit / highLimit | Scale limits |
| units | Weight units, e.g. `kg` |
| name | Station name |
| security | `OPEN`, `SECURE`, and on Linux terminals `SIGNON` / `SECURE_SIGNON` (see notes) |
| protocol | Transaction protocol, e.g. `ROBOT-API`, `TRANSACT-API` |
| scale | Scale integration, e.g. `MICRO-A12E` |
| message | Idle-screen message |
| session | New session id issued for this setup |
| date / time | Server date and time |
| type | Application type (`DISABLED/AUTO/TERMINAL/SCALE/SCANNER/BINTIP/FORKLIFT/DUALSCAN/LABELPRINT/...`) |
| serverURL | Configuration (SCADA) endpoint |
| transactionURL | Transaction endpoint. Optional — only in a split system (may be a third party). Applies to all families |
| signOnUsername / signOnPassword | Credentials for a protected `transactionURL` (used with `security = SECURE`) |
| mqttURL / mqttUsername / mqttPassword / mqttTopic | Only when MQTT is configured |

#### T200 series (ESP32 terminals)
A T200-class terminal runs on a microcontroller with **minimal processing and
fixed-size buffers**, so its `responseSetup` is kept **simple** — the base fields
only, plus `lightsOnTime`. It has no browser and runs no device web app, so it is
**never** sent `deviceWebApp` or `deviceToken` (they are useless to it and risk
overflowing its buffers). It can still be given a `transactionURL` for a split /
third-party transaction server. Because a T200 does not understand the newer
sign-on values, a sign-on configuration reaches it as `SECURE` — the value its
firmware has always read as "sign on with the configured credentials" — never
`SIGNON` / `SECURE_SIGNON`.

`lightsOnTime` is only supported by T202 firmware 2.2.1 and later.

```JSON
{
    "responseSetup" : {
        "MAC" : "AA:BB:CC:00:11:22",
        "status" : "ENABLED",
        "lowLimit" : "850",
        "highLimit" : "1150",
        "units" : "kg",
        "name" : "Weighbridge 1",
        "security" : "SECURE",
        "protocol" : "ROBOT-API",
        "scale" : "MICRO-A12E",
        "message" : "IDLE MESSAGE",
        "session" : "0123456789abcdef",
        "date" : "yyyy-mm-dd",
        "time" : "12:00:00",
        "type" : "SCALE",
        "serverURL" : "http://192.168.0.1/robot/api/",
        "transactionURL" : "http://third-party.example.com/scale/",
        "signOnUsername" : "robot01",
        "signOnPassword" : "secret",
        "lightsOnTime" : "20"
    }
}
```

On a single-server install, drop `transactionURL`/`signOn*` and set
`security` to `OPEN`; transactions then go to `serverURL`.

#### T400 / T500 series and ITPC (Linux terminals)
These devices run a full operating system and a **device web app**, so their
`responseSetup` carries extra fields the app needs:

- **`deviceToken`** — the terminal's own JWT credential for this server's
  `/api/v1/transact/`, written once into the client's config. Only issued to
  web-app-capable models. With a `deviceToken` the terminal authenticates by the
  token, so it does not sign on with `signOnUsername`/`signOnPassword`.
- **`deviceWebApp`** — the app bundle to install (present only when a bundle
  targets the model). The same block firmware receives, plus a `slug` naming the
  directory to unpack into.

These devices support the full sign-on values, so `security` may be `SIGNON` or
`SECURE_SIGNON`. `transactionURL` here is typically this server's transaction API.

```JSON
{
    "responseSetup" : {
        "MAC" : "AA:BB:CC:00:11:22",
        "status" : "ENABLED",
        "lowLimit" : "0",
        "highLimit" : "25",
        "units" : "kg",
        "name" : "Packing Point 3",
        "security" : "SECURE_SIGNON",
        "protocol" : "TRANSACT-API",
        "scale" : "MICRO-A12E",
        "message" : "IDLE MESSAGE",
        "session" : "0123456789abcdef",
        "date" : "yyyy-mm-dd",
        "time" : "12:00:00",
        "type" : "LABELPRINT",
        "serverURL" : "http://192.168.0.1/robot/api/",
        "transactionURL" : "http://192.168.0.1:8080/api/v1/transact/",
        "signOnUsername" : "",
        "signOnPassword" : "",
        "deviceToken" : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "deviceWebApp" : {
            "uuid" : "b3d1c2e4-1f5a-4c8a-a1e2-2d5f7b0c9a11",
            "name" : "labelprint-2.3.1.tar.gz",
            "slug" : "labelprint",
            "version" : "2.3.1",
            "size" : 184320,
            "download_url" : "http://192.168.0.1:8080/media/firmware/labelprint-2.3.1.tar.gz",
            "md5_checksum" : "9f86d081884c7d659a2feaa0c55ad015",
            "sha256_checksum" : "e3b0c44298fc1c149afbf4c8996fb924...",
            "is_latest" : true
        }
    }
}
```

| Field | Family | Description |
|---|---|---|
| lightsOnTime | T200 (T202 fw 2.2.1+) | Seconds the button lights stay on |
| deviceToken | T400 / T500 / ITPC | JWT credential for `/api/v1/transact/`. Only issued to web-app-capable models |
| deviceWebApp | T400 / T500 / ITPC | Web app bundle to install; only when a bundle targets the model |
| transactionURL | any | Transaction endpoint (split / third-party). Omitted on single-server installs |
| mqttURL / mqttUsername / mqttPassword / mqttTopic | any | Only when MQTT is configured |

#### Auto Sign On
If the transaction URL is a protected resource the Robot can automatically sign on to obtain a JWT session Token for instance. The Robot will then automatically add it to the Authorization section of the header as a Bearer token.
</p>
</details>

<details><summary>Operator Sign On/Off</summary>
Operator identification is handled in various manners. The following are supported; RFID cards, USB type I-Button dongles, personel barcode and keypad user codes. Signing out can happen on a timeout, pushed by the server or when removing the USB dongle.
<p>

### Operator Logon
```JSON
{
    "publishLogon" : {
        "MAC" : "AA:BB:CC:00:11:22",
        "id" : "0123456789abcdef",
        "session" : "0123456789abcdef"
    }
}
```

### Operator Logoff
```JSON
{
    "publishLogoff" : {
        "MAC" : "AA:BB:CC:00:11:22",
        "session" : "0123456789abcdef"
    }
}
```

</p>
</details>

<details><summary>Publish Transactions</summary>
A transaction command will always start with the word publish. In some cases a request is initiated before a publish is issued.

<p>

### List of publish commands

#### Publish a Button Press - DEPENDS ON PROFILE AND APP STATE
```JSON
{
    "publishButton" : {
        "MAC" : "AA:BB:CC:00:11:22",
        "id" : "0123456789abcdef",
        "button" : "B1/B2/B3/B4/B5/B6",
        "barcode" : "0123456789abcdef",
        "session" : "0123456789abcdef"
    }
}
```

#### Publish Scale Weight - SCALE PROFILE
```JSON
{
    "publishScaleWeight" : {
        "MAC" : "AA:BB:CC:00:11:22",
        "id" : "0123456789abcdef",
        "barcode" : "0123456789abcdef",
        "weight" : "1100.00",
        "units" : "kg/NOT-SET",
        "status" : "NORMAL/OVERRIDE/UNDER/OVER",
        "session" : "0123456789abcdef"
    }
}
```

#### Publish a Barcode Scan - SCANNER PROFILE
```JSON
{
    "publishBarcodeScan" : {
        "MAC" : "AA:BB:CC:00:11:22",
        "id" : "0123456789abcdef",
        "barcode" : "0123456789abcdef",
        "status" : "NORMAL/OVERRIDE/UNDER/OVER",
        "session" : "0123456789abcdef"
    }
}
```

#### Move a Pallet - FORKLIFT PROFILE
To move a pallet two commands are needed. First is to request the move, which verifies the pallet location. The second is to publish the new position.

To request the move and verify the position:
```JSON
{
    "requestPalletMove" : {
        "MAC" : "AA:BB:CC:00:11:22",
        "id" : "0123456789abcdef",
        "barcode" : "0123456789abcdef",
        "status" : "REQUEST",
        "session" : "0123456789abcdef",
        "location" : "Current Location"
    }
}
```

To publish the pallet move:
```JSON
{
    "publishPalletStore" : {
        "MAC" : "AA:BB:CC:00:11:22",
        "id" : "0123456789abcdef",
        "barcode" : "0123456789abcdef",
        "status" : "REQUEST",
        "session" : "0123456789abcdef",
        "location" : "Current Location",
        "destination" : "New Location"
    }
}
```

#### Response
In response to "responseKeypad":
This will redirect the user to keypad input. Important that this is only supported by Robots with full keypads. The "code" attribute is the entered value.
```JSON
{
    "publishKeypadCode" : {
        "MAC" : "AA:BB:CC:00:11:22",
        "id" : "0123456789abcdef",
        "code" : "0123456789abcdef",
        "status" : "NORMAL",
        "session" : "0123456789abcdef"
    }
}
```

#### Print a label - LABELPRINT Profile
Requesting a label **packs a carton** on the server — a container is created and
allocated a storage id — and then spools its label to the printer installed at
the station's packing point (resolved by position, so a swapped printer is
followed automatically). This is the same operation as the TRANSACT-API
`label/` endpoint.

Because a carton is created, the request must be **idempotent**: include a
`transactionId` (a UUID) generated **once per label press and kept identical
across every retry** of that press. A resend carrying the same id replays the
same label instead of packing a second carton; a first attempt still running
answers `please wait`. Firmware that does not yet send an id is covered by a
short server-side time guard (`LABEL_DEDUP_SECONDS`, default 3s) that debounces
a resend/double-press — best-effort only, so sending a `transactionId` is
required for the exactly-once guarantee.

The server can force the user to logoff immediately by setting the
responseStation status to LOGOFF. The station display reflects the outcome:
label printed / recorded / no run / no drop / no design / missing fields, or
`please wait` for a duplicate still in progress.

Firmware tracking: robot-t201-http#4, robot-t202-fw#10.
```JSON
{
    "publishPrintLabel" : {
        "MAC" : "AA:BB:CC:00:11:22",
        "id" : "0123456789abcdef",
        "transactionId" : "550e8400-e29b-41d4-a716-446655440000",
        "option" : "0123456789abcdef",
        "status" : "NORMAL",
        "session" : "0123456789abcdef"
    }
}
```

</p>
</details>

<details><summary>Remote Procedure Calls</summary>
The server can provide a list of RPCs for the Robot to execute. By holding down the designated button, assigned differently for each keypad variation, the user can access a list of RPCs. To execute the RPC, the operator can either press a button or scan a barcode.
<p>

### Request a List of RPCs
During the Robot's boot cycle it will request a list of RPCs. If not supported the server can simply provide an empty array. The returned data is a key-value-pair, of which the key is the command the value the description. The KEY will be send to the server to execute the particular RPC. The maximum RPCs are 8 and the command KEY length 16 characters.

#### RPC List Request Command
```JSON
{
    "requestRpcList" : {
        "MAC" : "AA:BB:CC:00:11:22"
    }
}
```

#### RPC List Response Payload
```JSON
{
  "responseRpcList":
  [
    { "REM-PAL": "Remove current pallet" },
    { "LOD-PAL": "Load existing pallet" },
    { "REM-BOX": "Remove carton from pallet" },
    { "FIND-PAL": "Find pallet" },
    { "REST-PAL": "Restore pallet" },
    { "REBUILD-PAL": "Rebuild pallet" },
    { "LOOK-BOX": "Lookup carton" }
  ]
}
```

### Execute a RPC Command
The operator must access the RPC list by holding the correct button for more than three seconds. After which the RPC list will appear. Navigate to the correct item and execute by either pressing a button or scanning a barcode. By pressing cancel the user can return to the operator view.

#### RPC Execute Command
```JSON
{
    "requestRpcExecute": {
        "MAC" : "80:1F:12:4D:3A:1C",
        "session" : "041bff54-3959-4db7-b3d5-6995843fa3ae",
        "id" : "0",
        "barcode": "4974052804014",
        "call": "REBUILD-PAL",
        "status": "NORMAL"
    }
}
```

#### RPC Execute Command Response
The response is any of the standard server responses.
For example:
```JSON
{
  "responseStation": {
    "MAC": "80:1F:12:4D:3A:1C",
    "status": "SUCCESS",
    "LCD1": "Executing Server Function",
    "LCD2": "REBUILD-PAL",
    "LCD3": "By Scanner",
    "LCD4": "Barcode: 4974052804014",
    "green": "true",
    "orange": "false",
    "red": "false"
  }
}
```

</p>
</details>

<details><summary>Certificate Provisioning</summary>
The Robot can request SSL/TLS certificates from the server for secure communications. This is used when the Robot needs to connect to services that require client certificates.
<p>

### Certificate Request
```JSON
{
    "requestCertificates" : {
        "MAC" : "AA:BB:CC:00:11:22"
    }
}
```

### Certificate Response
The server returns the certificate content and type associated with the Robot entity.
```JSON
{
    "responseCertificates" : {
        "MAC" : "AA:BB:CC:00:11:22",
        "certificate" : "-----BEGIN CERTIFICATE-----\nMIID...base64...\n-----END CERTIFICATE-----",
        "type" : "PEM"
    }
}
```

If the Robot has no certificate assigned, the server responds with `requestReset`.

</p>
</details>

<details><summary>Server Responses</summary>
The Robot statemachine can be redirected by different responses.
<p>

### List of Response Types

#### Response-Station
Response-Station is the standard response that will update the screen and LEDs. This is the most important response and will be used in most cases. The status values can have different applications depending on the profile. For instance a status code of LOGOFF can automatically logoff a user.

```JSON
{
    "responseStation" : {
        "MAC" : "AA:BB:CC:00:11:22",
        "status" : "OK/FAIL/DENIED/LOGOFF",
        "LCD1" : "Pallet OK",
        "LCD2" : "#1001010",
        "LCD3" : "Weight:",
        "LCD4" : "1000.0 kg",
        "green" : "true/false",
        "orange" : "true/false",
        "red" : "true/false"
    }
}
```

#### Response-User
The Robot statemachine will redirect to a screen where user input can be prompted. A single button press will submit the action.

```JSON
{
    "responseUser" : {
        "MAC" : "AA:BB:CC:00:11:22",
        "status" : "OK",
        "LCD1" : "Pallet OK",
        "LCD2" : "#1001010",
        "LCD3" : "Weight:",
        "LCD4" : "1000.0 kg",
        "green" : "true/false",
        "orange" : "true/false",
        "red" : "true/false"
    }
}
```

#### Response-Keypad
Response-Keypad is only applicable to a full keypad version of the Robot. In this case a string of numbers can be entered and upon pressing enter it will be submitted to the server. See "publishKeypadCode".
```JSON
{
    "responseKeypad" : {
        "MAC" : "AA:BB:CC:00:11:22",
        "status" : "OK",
        "LCD1" : "Enter password",
        "LCD2" : "Press enter",
        "LCD3" : "",
        "LCD4" : "",
        "green" : "true/false",
        "orange" : "true/false",
        "red" : "true/false"
    }
}
```

#### Response-Certificates
Provides SSL/TLS certificates to the Robot. Returned in response to `requestCertificates`. See [Certificate Provisioning](#certificate-provisioning) for the full payload format.

</p>
</details>

## Command Reference

Summary of all supported commands and their direction.

| Command | Direction | Description |
|---|---|---|
| `requestSetup` | Robot → Server | Boot configuration request |
| `responseSetup` | Server → Robot | Full runtime configuration |
| `responseSetupURL` | Server → Robot | Redirect to configuration server |
| `requestPing` | Robot → Server | Heartbeat / keepalive |
| `responsePong` | Server → Robot | Heartbeat response |
| `requestReset` | Server → Robot | Force device reboot |
| `requestInformation` | Server → Robot | Query device info |
| `responseInformation` | Robot → Server | Device info response |
| `requestStatus` | Server → Robot | Query device status |
| `publishStatus` | Robot → Server | Device status report |
| `requestDateTime` | Robot → Server | Time sync request |
| `responseDateTime` | Server → Robot | Time sync response |
| `publishLogon` | Robot → Server | Operator sign on |
| `publishLogoff` | Robot → Server | Operator sign off |
| `publishButton` | Robot → Server | Button press event |
| `publishScaleWeight` | Robot → Server | Scale weight reading |
| `publishBarcodeScan` | Robot → Server | Barcode scan event |
| `requestPalletMove` | Robot → Server | Pallet move verification |
| `publishPalletStore` | Robot → Server | Pallet move confirmation |
| `publishKeypadCode` | Robot → Server | Keypad code entry |
| `publishPrintLabel` | Robot → Server | Pack a carton and print its label (idempotent on `transactionId`) |
| `requestRpcList` | Robot → Server | Request available RPCs |
| `responseRpcList` | Server → Robot | List of available RPCs |
| `requestRpcExecute` | Robot → Server | Execute an RPC |
| `requestCertificates` | Robot → Server | Request SSL/TLS certificates |
| `responseCertificates` | Server → Robot | Certificate provisioning |
| `responseStation` | Server → Robot | Update display and LEDs |
| `responseUser` | Server → Robot | Prompt for user input |
| `responseKeypad` | Server → Robot | Prompt for keypad entry |
