const clarifaiRequest = (req, resp) => {

    const {imgUrl} = req.body; 

    if(!imgUrl) return;

    //API clarifi configuration
    const USER_ID = `${process.env.TOKEN_ID}`;
    const PAT = `${process.env.PATH_KEY}`;
    const APP_ID = 'my-first-application';
    const MODEL_ID = 'face-detection';
    const MODEL_VERSION_ID = '6dc7e46bc9124c5c8824be4822abe105';    
    const IMAGE_URL = imgUrl;


    const raw = JSON.stringify({
        "user_app_id": {
            "user_id": USER_ID,
            "app_id": APP_ID
        },
        "inputs": [
            {
                "data": {
                    "image": {
                        "url": IMAGE_URL
                    }
                }
            }
        ]
    });


    const requestOptions = {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Authorization': 'Key ' + PAT
        },
        body: raw
    };



    fetch("https://api.clarifai.com/v2/models/" + MODEL_ID + "/versions/" + MODEL_VERSION_ID + "/outputs", requestOptions)
    .then(response => response.json())
    .then(result => resp.json(result))
    .catch(error => console.log("There is an error", error))

    
};

module.exports = {
    clarifaiRequest: clarifaiRequest
}