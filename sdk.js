(function (global) {

    // 전역 객체 생성
    const LeadFineSDK = {};
    let apiKey = null;
    const IP = null;
    let formSubmit = false;
    let isLocalStorage = false;

    const LEADFINE_API_URL = "http://localhost:8080/api/v0.0/sdk";
    const LEADFINE_LOCALSTORAGE_FORM_KEY = "leadFineUserId";
    const MEANINGFUL_DWELL_TIME = 3000; // ms
    const FORM_KEY = window.location.pathname.slice(5);

    // 초기화 함수
    LeadFineSDK.init = function (key) {
        if (!key) {
            console.error('API key가 필요합니다.');
            return;
        }
        apiKey = key;
        console.log('LeadFine이 활성화 되었습니다 APIkey:', apiKey);

        let origin = LeadFineSDK.getOrigin(); // SPA일때는 isLocalStorage가 잘 동작 하지만, SPA가 아닐때는 페이지 마다 SDK가 생성되어서 isLocalStorage가 sync되지 않아 이렇게 개발함
        if(localStorage.getItem(origin)){
            isLocalStorage = true;
        }
    };

    LeadFineSDK.getLeadFineApiUrl = function (){
        return LEADFINE_API_URL;
    }
    LeadFineSDK.getLeadFineLocalStorageFormKey = function (){
        return LEADFINE_LOCALSTORAGE_FORM_KEY;
    }
    LeadFineSDK.getMeaningfulDwellTime = function (){
        return MEANINGFUL_DWELL_TIME;
    }
    LeadFineSDK.getFormKey = function (){
        return FORM_KEY
    }

    LeadFineSDK.getUrl = function (){
        return window.location.href;
    }

    LeadFineSDK.getOrigin = function (){
        return window.location.origin;
    }

    LeadFineSDK.getIP = function (url){
        fetch(url) // Replace YOUR_TOKEN with your ipinfo token
            .then(response => response.json())
            .then(data => {
            })
            .catch(error => console.error("Error fetching IP:", error));
        return IP;
    }

    LeadFineSDK.getTitle = function (){
        return document.title;
    }

    LeadFineSDK.fetchData = async function (url, data){
        let response = await fetch(url, {
            method: 'POST', // 또는 'PUT', 'PATCH'
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data), // 데이터를 JSON 문자열로 변환
        });
        let promise = await response.json();
        console.log('response value: ', promise);
    }

    LeadFineSDK.isLocalStorage = function (){
        return isLocalStorage;
    }

    LeadFineSDK.changeLocalStorageTrue = function (){
        isLocalStorage = true;
    }

    LeadFineSDK.isFormSubmit = function (){
        return formSubmit;
    }

    LeadFineSDK.submitForm = function (){
        formSubmit = true;
    }


    // 전역 객체로 등록
    global.LeadFineSDK = LeadFineSDK;
})(window);



LeadFineSDK.init(123); // key값을 입력하세요

class ViewedPage {
    constructor(dwellTime, url, title) {
        this.dwellTime = dwellTime;
        this.url = url;
        this.title = title;
    }

    // JSON 데이터를 ViewedPage 인스턴스로 복원
    static fromJSON(json) {
        return new ViewedPage(json.dwellTime, json.url, json.title);
    }
}

class Data {
    constructor(userOfPartnerId= null, count=0) {
        this.formKey = LeadFineSDK.getFormKey();
        this.userOfPartnerId = userOfPartnerId;
        this.count = count;
        this.viewedPages = [];
    }

    addViewedPage(viewedPage) {
        this.viewedPages.push(viewedPage);
    }

    // JSON 데이터를 Data 인스턴스로 복원
    static fromJSON(json) {
        const data = new Data(json.company, json.userOfPartnerId, json.count);
        data.viewedPages = json.viewedPages.map(ViewedPage.fromJSON); // ViewedPage 배열 복원
        return data;
    }
}

class HttpBody {
    constructor(timestamp, data) {
        this.timestamp = timestamp;
        this.data = data;
    }

    // JSON 데이터를 HttpBody 인스턴스로 복원
    static fromJSON(json) {
        return new HttpBody(json.timestamp, Data.fromJSON(json.data)); // Data 복원
    }
}


window.addEventListener("load", async function (e) {
    let origin = LeadFineSDK.getOrigin();
    let title = LeadFineSDK.getTitle();
    let url = LeadFineSDK.getUrl();

    window.addEventListener("popstate", function (e) {
        clearTimeout(timer);
    });

    let timer = setTimeout(()=>{ // setTimeout은 부정확 하다. 하지만 지금 수준에서는 이렇게 사용해도 무방하다.
        let viewedPage = new ViewedPage(LeadFineSDK.getMeaningfulDwellTime()/1000, url, title );

        let httpBody;
        if (LeadFineSDK.isLocalStorage()){
            const storedHttpBody = localStorage.getItem(origin);
            httpBody = HttpBody.fromJSON(JSON.parse(storedHttpBody));
        } else{
            data = new Data();
            httpBody = new HttpBody(new Date().toISOString(), data);
        }

        httpBody.data.addViewedPage(viewedPage);
        httpBody.data.count += 1;

        localStorage.setItem(origin, JSON.stringify(httpBody));
        console.log('saved');

        if(!LeadFineSDK.isLocalStorage()){
            LeadFineSDK.changeLocalStorageTrue();
        }
    }, LeadFineSDK.getMeaningfulDwellTime());
});

document.addEventListener("submit", function (e) {
    e.preventDefault();

    // LocalStorage에서 유저가 방문 페이지를 조회
    const storedHttpBody = localStorage.getItem(LeadFineSDK.getOrigin());
    console.log("storedHttpBody = ", storedHttpBody);
    httpBody = HttpBody.fromJSON(JSON.parse(storedHttpBody));
    console.log("httpBody data = ", httpBody.data);

    httpBody.data.company = LeadFineSDK.getCompany();

    // 폼을 입력함으로서 생긴 유저 uuid를 조회
    console.log('partnerOfUserUUID',formValueObject.formValues[i].value)
    httpBody.data.userOfPartnerId = formValueObject.formValues[i].value;
    console.log(httpBody);
    LeadFineSDK.fetchData(LeadFineSDK.getLeadFineApiUrl(), httpBody);

});
