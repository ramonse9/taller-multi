import { Component, inject, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { NgIcon } from "@ng-icons/core";

@Component({
  selector: 'app-page-button-back',
  imports: [RouterLink, NgIcon],
  templateUrl: './page-button-back.component.html'
})
export class PageButtonBackComponent implements OnInit {

  location = inject(Location)
  router = inject(Router)

  baseUrl = ''


  ngOnInit(): void {

    const currentUrl = this.router.url;
    const parts = currentUrl.split('/');
    parts.pop();
    this.baseUrl = parts.join('/');


  }

}
