import { Component, ElementRef, ViewChild } from "@angular/core";
import { LoadingController, ToastController } from "@ionic/angular";
import jsQR from "jsqr";

@Component({
  selector: "app-home",
  templateUrl: "home.page.html",
  styleUrls: ["home.page.scss"],
})
export class HomePage {
  scanActive = false;
  scanResult = null;
  @ViewChild("video", { static: false }) video: ElementRef;
  @ViewChild("canvas", { static: false }) canvas: ElementRef;

  videoElement: any;
  canvasElement: any;
  canvasContext: any;

  loadingQr: HTMLIonLoadingElement;

  constructor(
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  ngAfterViewInit() {
    this.videoElement = this.video.nativeElement;
    this.canvasElement = this.canvas.nativeElement;
    this.canvasContext = this.canvasElement.getContext("2d");
  }

  async startScan() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
    });
    this.videoElement.srcObject = stream;
    this.videoElement.setAttribute("playinline", true);
    this.videoElement.play();
    this.loadingQr = await this.loadingCtrl.create({});
    await this.loadingQr.present();
    requestAnimationFrame(this.scan.bind(this));
  }
  stopScan() {
    this.scanActive = false;
  }
  reset() {
    this.scanResult = null;
  }

  async scan() {
    if (this.videoElement.readyState === this.videoElement.HAVE_ENOUGH_DATA) {
      if (this.loadingQr) {
        await this.loadingQr.dismiss();
        this.loadingQr = null;
        this.scanActive = true;
      }

      this.canvasElement.height = this.videoElement.videoHeight;
      this.canvasElement.width = this.videoElement.videoWidth;

      this.canvasContext.drawImage(
        this.videoElement,
        0,
        0,
        this.canvasElement.width,
        this.canvasElement.height
      );
      const imageData = this.canvasContext.getImageData(
        0,
        0,
        this.canvasElement.width,
        this.canvasElement.height
      );

      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });
      if (code) {
        this.scanActive = false;
        this.scanResult = code.data;
        this.showQrToast();
      } else {
        if (this.scanActive) {
          requestAnimationFrame(this.scan.bind(this));
        }
      }
    } else {
      requestAnimationFrame(this.scan.bind(this));
    }
  }

  async showQrToast() {
    const toast = await this.toastCtrl.create({
      message: `Open ${this.scanResult}?`,
      position: "top",
      buttons: [
        {
          text: "Open",
          handler: () => {
            window.open(this.scanResult, "_system", "location=yes");
          },
        },
      ],
    });
    toast.present();
  }
}
