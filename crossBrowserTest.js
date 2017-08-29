const querystring = require('querystring');
const cbt = require('cbt_tunnels');
const request = require('request');
const fs = require('fs');
const unzip = require('unzip2');

const username = //CBT_username;
const authKey = //CBT_authKey;
const basicAuth = Buffer.from(unescape(encodeURIComponent(username + ":" + authKey))).toString('base64');

const chromeBrowsers = ['Chrome59', 'Chrome60'];
const ieBrowsers = ['IE11'];
const firefoxBrowsers = ['FF54'];
const iosMobile = ['iPhone5s-ios7sim|MblSafari7.0', 'iPhone7-ios102sim|MblSafari10.0'];
const androidMobile = ['GalaxyS3-And41|MblChrome51','Nexus9-And60|MblChrome59'];

const testUrl = //testUrl
const testBrowsers = chromeBrowsers.concat(ieBrowsers, iosMobile, androidMobile);

let intervalId;

const screenshotOptions = querystring.stringify({
    url: testUrl,
    browsers: testBrowers
});

const getZipScreenshots = (zipFileUrl) => {
    return new Promise(resolve => {
        request({
            headers: {'Authorization': "Basic " + `${basicAuth}`},
            uri: zipFileUrl
        }).pipe(unzip.Extract({path: './screenshots'}).on('finish', () => resolve()));
    })
}

const isRunning = async (screenshotTestId) => {
    request({
        headers: {'Authorization': "Basic " + `${basicAuth}`},
        uri: 'https://crossbrowsertesting.com/api/v3/screenshots/' + screenshotTestId,
    }, (err, res, body) => {
        if (!err && res.statusCode == 200){
            body = JSON.parse(body);
            if(!body.versions[0].active) {
                clearInterval(intervalId);
                console.log('Screenshots taken');
                console.log('URL: ', body.versions[0].show_results_web_url);
                console.log('Zip Url: ', body.versions[0].download_results_zip_url);
                getZipScreenshots(body.versions[0].download_results_zip_url).then(() => cbt.stop());
            } else {
                console.log('Still Running');
            }
        };
    });
};

const screenshotTestApi = () => {
    request.post({
        headers: {'Authorization': "Basic " + `${basicAuth}`},
        uri: 'https://crossbrowsertesting.com/api/v3/screenshots?' + screenshotOptions
    }, (err, res, body) => {
        if (!err && res.statusCode == 200){
            body = JSON.parse(body)
            console.log('Screenshot Test Id: ', body.screenshot_test_id);
            console.log('Test URL: ', body.url);
            intervalId = setInterval(isRunning, 5000, body.screenshot_test_id);
        } else {
            console.error(err)
        }
    })
};

cbt.start({"username": username, "authkey": authKey}, (err) => {
    if(err) { return console.error(err) };
    screenshotTestApi();
});
