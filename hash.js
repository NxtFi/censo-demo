window.crypto = window.crypto || window.msCrypto; //for IE11
if(window.crypto.webkitSubtle){
    window.crypto.subtle = window.crypto.webkitSubtle; //for Safari
}

async function hashFile(binary) {
  const encoderHash = new TextEncoder();
  const digest = await window.crypto.subtle.digest(
    "SHA-512",
    encoderHash.encode(binary)
  );
  const hexDigest = buf2hex(new Uint8Array(digest).buffer);
  return hexDigest;
}

function buf2hex(buffer) {
  // buffer is an ArrayBuffer
  return Array.prototype.map
    .call(new Uint8Array(buffer), (x) => ("00" + x.toString(16)).slice(-2))
    .join("");
}

async function singHash(privkey, hash) 
{
  let privateKey = await getPrivKey(privkey)
  .then(async function (privateKey) {
    console.log("privatekey::", privateKey);
    const encoder = new TextEncoder();
    let signature0 = await window.crypto.subtle.sign(
      {
        name: "RSA-PSS"
      },
      privateKey,
      encoder.encode(hash)
    )
    .catch(async function (err) {
      console.log("Error interno firmando");
      const error = await err
      console.log(error)
    });
  
    var signature1 = await base64Arraybuffer(
      new Uint8Array(signature0).buffer
    );
  
    console.log(signature1);    
    return signature1;
  })
  .catch(async function (err) {
    console.log("Error firmando");
    const error = await err
    console.log(error)
  }); 
  return privateKey;
}

async function getPrivKey(rawPK) {
  let importedPrivKey = await window.crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBufferPrivate(rawPK),
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: { name: "SHA-512" }
    },
    false,
    ["sign"]
  )
  .then(async function (ik) {
    return ik;
  })
  .catch(async function (err) {
    console.log("Error importando la llave");
    const error = await err
    console.log(error)
  });
  return importedPrivKey;
}

function pemToArrayBufferPrivate(pem) {
  var b64Lines = removeLines(pem);
  var b64Prefix = b64Lines.replace('-----BEGIN RSA PRIVATE KEY-----', '');
  var b64Final = b64Prefix.replace('-----END RSA PRIVATE KEY-----', '');
  return base64ToArrayBuffer(b64Final);
}    

function base64ToArrayBuffer(b64) {
  var byteString = atob(decodeURIComponent(b64));
  var byteArray = new Uint8Array(byteString.length);
  for (var i = 0; i < byteString.length; i++) {
    byteArray[i] = byteString.charCodeAt(i);
  }
  return byteArray;
}

function removeLines(str) {
  return str.replace(/(\r\n|\n|\r)/gm, "");
}

const base64Arraybuffer = async (data) => {
  const base64url = await new Promise((r) => {
    const reader = new FileReader();
    reader.onload = () => r(reader.result);
    reader.readAsDataURL(new Blob([data]));
  });
  return base64url.split(",", 2)[1];
};
