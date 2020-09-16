# casa-corrently
Casa-Corrently is an energy monitoring solution design to run from within a local network (home area network). It might be used either standalone, as Node-RED module or embedded into other applications.

This core module is designed to work with smartmeters (Electricity only). If you do not have a Smart Meter you might get it [here from STROMDAO](https://www.corrently.de/transparenz/bestellung-smartmeter/) (Germany only).

![npm](https://img.shields.io/npm/dw/casa-corrently) [![Build Status](https://travis-ci.com/energychain/casa-corrently.svg?branch=master)](https://travis-ci.com/energychain/casa-corrently) [![Code Quality](https://www.code-inspector.com/project/12360/score/svg)](https://frontend.code-inspector.com/public/project/12360/casa-corrently/dashboard) [![This project is using Percy.io for visual regression testing.](https://percy.io/static/images/percy-badge.svg)](https://percy.io/c0972268/casa-corrently) [![chat](https://img.shields.io/badge/chat-support-brightgreen)](https://tawk.to/chat/5c53189451410568a109843f/default)

- [casa-corrently](#casa-corrently)
  * [Sample Usage](#sample-usage)
    + [Online Demo (via Heroku)](#online-demo-via-heroku)
    + [Homescreen](#homescreen)
    + [Energy Price statistics](#energy-price-statistics)
    + [Community Screen](#community-screen)
  * [Installation](#installation)
    + [Standalone](#standalone)
    + [Node-RED (Node) via Shell](#node-red-node-via-shell)
    + [Node-RED (Node) via Editor](#node-red-node-via-editor)
  * [QuickStart](#quickstart)
    + [Prerequisites](#prerequisites)
    + [Corrently Demo Meter(s) - Full generation (Messkonzept1 - Volleinspeisung)](#corrently-demo-meters---full-generation-messkonzept1---volleinspeisung)
    + [Corrently Demo Meter(s) - surplus feed-in (Messkonzept2 - Überschusseinspeisung)](#corrently-demo-meters---surplus-feed-in-messkonzept2---uberschusseinspeisung)
    + [Accessing Demo](#accessing-demo)
  * [Usage](#usage)
    + [First time usage](#first-time-usage)
    + [Modify time and reading of installation (optional)](#modify-time-and-reading-of-installation-optional)
    + [Output (standard)](#output-standard)
    + [Output with statistics (advanced)](#output-with-statistics-advanced)
    + [Output with aggregation (advanced)](#output-with-aggregation-advanced)
  * [Sample flows](#sample-flows)
    + [Messkonzept 2 (Überschußeinspeisung) ohne Z2 (Produktionszähler)](#messkonzept-2-uberschusseinspeisung-ohne-z2-produktionszahler)
  * [Standalone usage](#standalone-usage)
    + [One Click Deployment](#one-click-deployment)
  * [Funding](#funding)
  * [Further reading](#further-reading)
  * [Maintainer / Imprint](#maintainer--imprint)
  * [LICENSE](#license)

## Sample Usage

### [Online Demo (via Heroku)](https://stromdao.de/casa)
https://stromdao.de/casa

### Homescreen
![Casa Corrently Homescreen](https://squad.stromdao.de/nextcloud/index.php/s/mK5Q5Px34q9cLwM/preview)

### Energy Price statistics
![Casa Corrently Strompreis](https://squad.stromdao.de/nextcloud/index.php/s/pgEeHSXLQYgZqRC/preview)

### Community Screen
![Casa Corrently Community](https://squad.stromdao.de/nextcloud/index.php/s/gWbbnw7SaqXiCsp/preview)


## Installation

### Standalone
Standalone installation uses an express http server to provide a nice looking UI (see sample screens above).
```shell
git clone https://github.com/energychain/casa-corrently.git
cd casa-corrently
npm install
```
You will get the UI at http://localhost:3000/ pre-configured for one of our demo households.
Copy `sample_config.json` to `config.json` and configure to your needs.


### Node-RED (Node) via Shell
```shell
cd ~/.node-red/
npm install --save casa-corrently
```

### Node-RED (Node) via Editor
Install `casa-corrently` as NODE package.

## QuickStart
This QuickStart allows you to start node-red with one the sample meters to get quickly familiar with this Node (module).

### Prerequisites
- Node-RED installed global (e.q you could start it from command line using `node-red`)
- Cloned version of GIT Repository https://github.com/energychain/casa-corrently.git

### Corrently Demo Meter(s) - Full generation (Messkonzept1 - Volleinspeisung)
Reference: https://casa.corrently.de/books/demo-z%C3%A4hler/page/messkonzept-1-%28volleinspeisung%29

```shell
npm install node-red-dashboard
npm run demo-messkonzept1
```

### Corrently Demo Meter(s) - surplus feed-in (Messkonzept2 - Überschusseinspeisung)
Reference: https://casa.corrently.de/books/demo-z%C3%A4hler/page/messkonzept-2-%28%C3%BCberschusseinspeisung%29

```shell
npm install node-red-dashboard
npm run demo-messkonzept2
```

### Accessing Demo
 - Editor: http://localhost:1880/
 - Dashboard (UI): http://localhost:1880/ui

###

## Usage
### First time usage
On first time adding a Discovery Meter to a flow the list of available meters will be empty.
- Add Discovergy login information to configuration node
- `Deploy` changes to flow
- Re-Open Configuration of Discovergy Meter

### Modify time and reading of installation (optional)
You might overwrite time and value of first reading from the node configuration.

### Output (standard)
If triggered (maybe periodic via an inject) this node provides a json Object as `msg.payload`.

```javascript
msg.payload =  {
  time: <TIME>, // time of reading per Discovergy API
  latest: {
    power: <POWERVALUE>, // Power in Watt * 10^-3
    power1: <POWERVALUE>,// Power in Watt * 10^-3 of Phase 1
    power2: <POWERVALUE>,// Power in Watt * 10^-3 of Phase 2
    power3: <POWERVALUE>,// Power in Watt * 10^-3 of Phase 3
    energy: <ENERGYVALUE>,// Actual Meter Reading in Watthours * 10^-7 (consumption . OBIS Code 1.8.0)
    energyOut: <ENERGYVALUE>,// Actual Meter Reading in Watthours * 10^-7 (production . OBIS Code 2.8.0)
    baseCosts: <EUROVALUE>, // Accumulated base fee (Grundgebühr) since first measument time (eq. installation - might be overwritten)
    energyCost: <EUROVALUE>, // Accumulated energy costs (Arbeitspreis) since first measument time (eq. installation - might be overwritten)
    energyRevenue: <EUROVALUE>, // Revenue from feeding Energy into the grid
    incomeSaldo: <EUROVALUE> // Pre Calculated : energyRevenue - (baseCosts + energyCost)
  }
}
```

### Output with statistics (advanced)
If `msg.topic` is set to `statistics` additional statistic information will be provided. Beside of power,power1,power2,power3 the object gets formated same as in `msg.payload.latest` above.

*NOTE: Retrieving statistics requires a significant higher amount of API calls. Consider to use it less than once per minute. *

```javascript
msg.payload =  {
  time: <TIME>// time of reading per Discovergy API
  latest: { ... }, // latest values
  last24h: { ... }, // From latest reading 24 hours backward
  today: { ... }, // Values from today
  yesterday: { ... }, // Values from yesterday
  monthToDay: { ... }, // Values from this month
  lastMonth: { ... }, // Values from last month
  yearToDay: { ... }, // Values from this year
  last365d: { ... } // Values from last 365 days
}
```

### Output with aggregation (advanced)
You might add multiple Discovergy Meters in sequence. In this case a property `aggregation` will contain aggregated values of all meters.


```javascript
msg.payload =  {
  time: <TIME>// time of reading per Discovergy API
  latest: { ... }, // latest values  
  aggregation: { ... } // Aggregated values of all meters in sequence
}
```
## Sample flows

### Messkonzept 2 (Überschußeinspeisung) ohne Z2 (Produktionszähler)

[Dashboard](https://flows.nodered.org/flow/6f43f7d48405927ab3231ef1eea38a96)

## Standalone usage
It is possible to run this node without Node-RED. It comes shipped with a express APP.

```shell
git clone https://github.com/energychain/casa-corrently.git
cd casa-corrently
npm install
npm start ./sample_config_messkonzept2.json
```

By default the Web UI will be visible at http://localhost:3000/index.html

### One Click Deployment
Heroku:
https://heroku.com/deploy?template=https://github.com/energychain/casa-corrently

### IPFS Support (early beta!)
It is possible access a Casa Corrently Instance via IPFS from remote. To do so you need to install `casa-corrently-ipfs-edge` and add an publisher entry into your `config.json`

installation of IPFS publisher
```shell
cd casa-corrently
npm install casa-corrently-ipfs-edge
```
In config.json
```javascript
{
  ...
  "publisher":"casa-corrently-ipfs-edge",
  ...
}
```

Restarting casa-corrently should provide you an ipfs URL of your `msg` objects.

You might use the following URLs from within the Webinterface:
- `http://localhost:3000/p2p?method=ls` gives list of available peers
- `http://localhost:3000/p2p?method=self` gives this peers infos
- `http://localhost:3000/p2p?method=msg&peer=CID` msg object of a peer

## Funding
This module is part of the Corrently Ecosystem which looks for funding in Germany:  https://www.stromdao.de/crowdfunding/info
![STROMDAO - Corrently Crowdfunding](https://squad.stromdao.de/nextcloud/index.php/s/Do4pzpM7KndZxAx/preview)

## Further reading
Further Documentation is available as Casa Corrently Chapter at: https://casa.corrently.de/books/nutzung-von-node-red/chapter/gr%C3%BCnstromz%C3%A4hler-%28discovergy-meter%29

## Maintainer / Imprint
<addr>
STROMDAO GmbH  <br/>
Gerhard Weiser Ring 29  <br/>
69256 Mauer  <br/>
Germany  <br/>
  <br/>
tel: +49 6226 968 009 0  <br/>
  <br/>
kontakt@stromdao.com  <br/>
  <br/>
Handelsregister: HRB 728691 (Amtsgericht Mannheim)
</addr>


## LICENSE
Apache-2.0
