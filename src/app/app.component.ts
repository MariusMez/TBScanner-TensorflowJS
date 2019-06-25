import {Component, OnInit} from '@angular/core';

import * as tbDetector from './tbdetector';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {
    title = 'TF-ObjectDetection';
    private video: HTMLVideoElement;


    ngOnInit() {
        this.webcam_init();
        this.predictWithCocoModel();
    }

    public async predictWithCocoModel() {
        const model = await tbDetector.load('mobilenet_v1');
        this.detectFrame(this.video, model);
        console.log('model loaded');
    }

    webcam_init() {
        this.video = <HTMLVideoElement>document.getElementById('vid');

        navigator.mediaDevices
            .getUserMedia({
                audio: false,
                video: {
                    facingMode: 'environment',
                }
            })
            .then(stream => {
                this.video.srcObject = stream;
                this.video.onloadedmetadata = () => {
                    this.video.play();
                };
            });
    }

    detectFrame = (video, model) => {
        model.detect(video).then(predictions => {
            this.renderPredictions(predictions);
            requestAnimationFrame(() => {
                this.detectFrame(video, model);
            });
        });
    }

    renderPredictions = predictions => {

        // Crop the code from the video and paste them in the eyes canvas:
        const codeCanvas = <HTMLCanvasElement>document.getElementById('code');
        const codeCC = codeCanvas.getContext('2d');
        const ratioX = this.video.videoWidth / this.video.width;
        const ratioY = this.video.videoHeight / this.video.height;

        const canvas = <HTMLCanvasElement>document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 600;
        canvas.height = 600;

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        // Font options.
        const font = '14px sans-serif';
        ctx.font = font;
        ctx.textBaseline = 'top';
        ctx.drawImage(this.video, 0, 0, canvas.width, canvas.height);

        predictions.forEach(prediction => {
            const x = prediction.bbox[0];
            const y = prediction.bbox[1];
            const width = prediction.bbox[2];
            const height = prediction.bbox[3];
            // Draw the bounding box.
            ctx.strokeStyle = '#51C200';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);
            // Draw the label background.
            ctx.fillStyle = '#51C200';
            const textWidth = ctx.measureText(prediction.class).width;
            const textHeight = parseInt(font, 10); // base 10
            ctx.fillRect(x, y, textWidth + 8, textHeight + 4);
            // Draw the text last to ensure it's on top.
            ctx.fillStyle = '#000000';
            ctx.fillText(`${prediction.class} (${(prediction.score * 100).toFixed(0)} %)`, x, y);

            codeCC.drawImage(this.video, x * ratioX, y * ratioY, width + 5, height + 5, 0, 0, codeCanvas.width, codeCanvas.height);
        });
    }
}
