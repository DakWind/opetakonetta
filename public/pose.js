let video;
let poseNet;
let pose;
let skeleton;

let brain;
let poseLabel;

let state = 'valmis tiedon keräämiseen';
let targetLabel;
let trained = [];
let letters = [];
let goal = ['t', 'i', 'e', 't', 'o'];

const modelInfo = {
    model: 'model/model.json',
    metadata: 'model/model_meta.json',
    weigths: 'model/model.weigths.bin',
}

// datan keruu ja tallentaminen jsoniksi
function keyPressed() {
    if (key == 's') {
        state = 'AI opettelee asennot...';
        //brain.saveData();
        dataReady();
    } else if (state == 'valmis tiedon keräämiseen') {
        targetLabel = key;
        trained.push(key);
        console.log(targetLabel);
        setTimeout(function() {
            state = 'tallentaa asentoja...';
            //console.log(state);

            setTimeout(function() {
                state = 'valmis tiedon keräämiseen';
                //console.log(state);
            }, 10000);

        }, 3000);
    }
}

function setup () {
    createCanvas(640, 480);
    video = createCapture(VIDEO);
    video.hide();
    // poseNet käynnistys
    poseNet = ml5.poseNet(video, modelLoaded);
    poseNet.on('pose', gotPoses);

    let options = {
        inputs: 34,
        outputs: 4,
        task: 'classification',
        debug: true
    }
    // tämä käynnistää mallin koulutusta varten
    brain = ml5.neuralNetwork(options);
    // tämä lataa trainatun mallin tiedostosta
    //brain.load(modelInfo, brainLoaded);
    // tämä lataa kerätyn datan
    //brain.loadData('linkki kerättyyn dataan', dataReady);
}

// kun koulutettu malli valmis
function brainLoaded() {
    console.log('pose classification ready');

    classifyPose();
}

// koulutettu malli työssään
function classifyPose() {
    if (pose) {
        let inputs = [];
        for (let i = 0; i < pose.keypoints.length; i++) {
            let x = pose.keypoints[i].position.x;
            let y = pose.keypoints[i].position.y;
            inputs.push(x);
            inputs.push(y);
        }
        brain.classify(inputs, gotResult);
    } else {
        setTimeout(classifyPose, 100);
    }
}

// koulutettu malli looppaa ja tässä määritellään mitä se tekee tulokselle
function gotResult(error, results) {
    if (results[0].confidence > 0.6) {
        //console.log(results);
        if (letters.length == 4) {
            if (results[0].label == goal[4]) {
                letters.push(results[0].label);
                state = 'onnistuit!';
            }
        } else if (letters.length == 3) {
            if (results[0].label == goal[3]) {
                letters.push(results[0].label);
            }
        } else if (letters.length == 2) {
            if (results[0].label == goal[2]) {
                letters.push(results[0].label);
            }
        } else if (letters.length == 1) {
            if (results[0].label == goal[1]) {
                letters.push(results[0].label);
            }
        } else if (letters.length == 0) {
            if (results[0].label == goal[0]) {
                letters.push(results[0].label);
            }
        }
        poseLabel = results[0].label;
    }
    //console.log(error);
    if (state != 'onnistuit!') {
        classifyPose();
    }
}

// mallin koulutus kun data valmis
function dataReady() {
    brain.normalizeData();
    brain.train({epochs: 50}, finished);
}

// koulutetun mallin tallennus, model.json etc
function finished() {
    state = 'AI valmis';
    console.log('model trained');
    // tämä tallentaisi mallin json/bin
    //brain.save();
    brainLoaded();
}

// datan kerääminen
function gotPoses(poses) {
    //console.log(poses);
    if (poses.length > 0) {
        pose = poses[0].pose;
        skeleton = poses[0].skeleton;
        if (state == 'tallentaa asentoja...') {
            let inputs = [];

        for (let i = 0; i < pose.keypoints.length; i++) {
            let x = pose.keypoints[i].position.x;
            let y = pose.keypoints[i].position.y;
            inputs.push(x);
            inputs.push(y);
        }
        let target = [targetLabel];

        brain.addData(inputs, target);
        }
    }
}

// poseNet valmis?
function modelLoaded () {
    console.log('poseNet ready');
}

// piirtäminen
function draw () {
    if (state != 'loppu') {
        push();
        translate(video.width, 0);
        scale(-1, 1);
        image(video, 0, 0, video.width, video.height);

        if (pose && state != 'AI valmis' && state != 'onnistuit!') {
            for (let i = 0; i < pose.keypoints.length; i++) {
                let x = pose.keypoints[i].position.x;
                let y = pose.keypoints[i].position.y;
                fill(255);
                ellipse(x,y,16,16);
            }
            for (let i = 0; i < skeleton.length; i++) {
                let a = skeleton[i][0];
                let b = skeleton[i][1];
                strokeWeight(2);
                stroke(255);
                line(a.position.x, a.position.y, b.position.x, b.position.y);
            }
        }
        pop();

        fill(255);
        noStroke();
        textSize(32);
        textAlign(LEFT);
        text(state, 5, 20);
        if (trained.length > 0 && state != 'AI valmis') {
            for (let i = 0; i < trained.length; i++) {
                textSize(12);
                text(trained[i], 10 + i * 20, height - 15);
            }
        }
        if (state != 'onnistuit!' && state != 'AI valmis') {
            textSize(512);
            textAlign(CENTER, CENTER);
            text(poseLabel, width / 2, height / 2);
        }

        if (letters.length > 0) {
            for (let i = 0; i < letters.length; i++) {
                textSize(256);
                textAlign(CENTER, CENTER);
                text(letters[i], 640 / 7 * (i + 1), height / 2);
            }
        }
        if (state == 'onnistuit!') {
            state = 'loppu';
        }
    }
}
