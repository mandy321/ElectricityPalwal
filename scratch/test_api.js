const xmlRequest = `<?xml version="1.0"?><Request VERSION="2" LANGUAGE_ID="1" LOCATION=""><Company Company_Id="93" /><Project Project_Id="304" /><User User_Id="Anonymous" /><IUVLogin IUVLogin_Id="Anonymous" /><ROLE ROLE_ID="1595" /><Event Control_Id="130404" /><Child Control_Id="125681" Report="HTML" AC_ID="163944"><Parent Control_Id="130402" Value="1" Data_Form_Id="" XValue="1" YValue="" ZValue="" /></Child></Request>`;
const base64Payload = btoa(xmlRequest);

fetch('https://chs.dhbvn.org.in/api/AppsavyServices/GetRelationalDataA', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'appsavylogin': 'IG7gR27IJYSa+a/dym3wpw==',
    'formid': 'TYDUFR2Pc592nssOkzMrLQ==',
    'roleid': 'KnSKi2BRa296VND7xI1XWQ==',
    'token': 'Wwzpa2LygAJqAK1uM94i8A==',
    'version': '1',
    'sourcetype': 'tzoukK4N1FBlaVGohFL/oQ=='
  },
  body: JSON.stringify({
    inputxml: base64Payload,
    DocVersion: 1
  })
})
.then(res => res.text())
.then(text => {
  console.log('Response length:', text.length);
  console.log(text.substring(0, 2000));
})
.catch(err => console.error(err));
