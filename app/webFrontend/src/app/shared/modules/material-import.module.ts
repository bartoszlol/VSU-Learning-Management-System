import {NgModule} from '@angular/core';
import {MatBadgeModule} from '@angular/material/badge';

import {
  MatAutocompleteModule,
  MatButtonModule,
  MatCardModule,
  MatCheckboxModule,
  MatDialogModule,
  MatFormFieldModule,
  MatIconModule,
  MatInputModule,
  MatListModule,
  MatDatepickerModule,
  MatMenuModule,
  MatNativeDateModule,
  MatProgressBarModule,
  MatRadioModule,
  MatSelectModule,
  MatSlideToggleModule,
  MatSnackBarModule,
  MatStepperModule,
  MatTabsModule,
  MatToolbarModule,
  MatTooltipModule,
  MatExpansionModule,
  DateAdapter,
  MatProgressSpinnerModule,
  MatChipsModule
} from '@angular/material';
import {CustomDateAdapter} from '../classes/CustomDateAdapter';

@NgModule({
  imports: [
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatDialogModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatNativeDateModule,
    MatProgressBarModule,
    MatStepperModule,
    MatRadioModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatBadgeModule
  ],
  exports: [
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatDialogModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatStepperModule,
    MatMenuModule,
    MatNativeDateModule,
    MatProgressBarModule,
    MatRadioModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatBadgeModule
  ],
  providers: [
    {provide: DateAdapter, useClass: CustomDateAdapter},
  ],
})
export class MaterialImportModule {
}