import { Component, OnInit } from '@angular/core';
import { environment } from '../environments/environment';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser'
import { Papa } from 'ngx-papaparse';

const KANJI_INDEX = 0;
const HIRAGANA_INDEX = 1;
const EN_INDEX = 2;
const SET_INDEX = 3;
const TEST_MODE_JP_TO_EN = 0;
const TEST_MODE_EN_TO_JP = 1;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = environment.TITLE;
  vocabSource = [];
  guessWordSet = [];
  guessWord = '';
  guessWordIndex = 0;
  answerEN = '';
  answerHG = '';
  showSucces = false;
  showError = false;
  showCongratz = false;
  testMode = 'Test Mode';
  testSet = 'Sets'
  vocabSets = [];
  correctAnswersCount = 0;
  totalItems = 0;
  errorMessage = '';

  constructor(private papa: Papa) { }

  ngOnInit() {
    localStorage.setItem('unanswered-vocabulary', JSON.stringify([]));

    this.papa.parse('../assets/n5.csv', {
      download: true,
      complete: function(result) {
        result.data.splice(-1, 1); // remove last empty element
        result.data.shift(); // remove the column rows

        var vocabularySetMap = new Map();
        var setList = [];

        result.data.forEach(function(item, index) {
          var setKey = item[SET_INDEX];
          var setOfWords = [];

          if (vocabularySetMap.has(setKey)) {
            setOfWords = vocabularySetMap.get(setKey);
            setOfWords.push(item);
            vocabularySetMap.set(setKey, setOfWords);
          } else {
            setOfWords.push(item);
            vocabularySetMap.set(setKey, setOfWords);
            setList.push(setKey);
          }
        });

        localStorage.setItem('vocabulary-set-keys', JSON.stringify(setList));
        localStorage.setItem('vocabulary-set-map', JSON.stringify(Array.from(vocabularySetMap.entries())));

        var currentSet = localStorage.getItem('active-set');

        if (currentSet != null) {
          var setArray = vocabularySetMap.get(currentSet);
          localStorage.setItem('vocabulary-source', JSON.stringify(shuffleArray(setArray)));
        } else {
          var setArray = vocabularySetMap.get(1);
          localStorage.setItem('active-set', JSON.stringify(1));
          localStorage.setItem('vocabulary-source', JSON.stringify(shuffleArray(setArray)));
        }

        // -> Fisher–Yates shuffle algorithm
        function shuffleArray(array) {
          var m = array.length, t, i;

          // While there remain elements to shuffle
          while (m) {
            // Pick a remaining element…
            i = Math.floor(Math.random() * m--);

            // And swap it with the current element.
            t = array[m];
            array[m] = array[i];
            array[i] = t;
          }

          return array;
        }
      }
    });

    this.loadData(this);
  }

  loadData(that) {
    var vocabularySetMap = JSON.parse(localStorage.getItem('vocabulary-set-map'));
    var vocabularySource = JSON.parse(localStorage.getItem('vocabulary-source'));

    if (typeof (vocabularySetMap) == 'undefined' || vocabularySetMap == null || Object.keys(vocabularySetMap).length == 0) {
      setTimeout(that.loadData(this), 10);
    } else {
      this.testSet = 'Set ' + JSON.parse(localStorage.getItem('active-set'));
      this.totalItems = vocabularySource.length;
      this.vocabSets = JSON.parse(localStorage.getItem('vocabulary-set-keys'));;
      this.nextWord(0);
    }
  }

  onKeydown() {
    var testWordEN = this.getVocabularyEN(this.guessWordSet).toLowerCase();
    var testWordHG = this.getVocabularyHG(this.guessWordSet);
    var ansEN = this.answerEN.toLowerCase();

    if (ansEN === testWordEN && this.answerHG === testWordHG) {
      console.log('CORRECT!!!!');
      this.toggleCorrectAnswerMessage();
      this.correctAnswersCount++;
      this.nextWord(1);
      console.log('' + this.guessWord);
    } else {
      if (ansEN !== testWordEN && this.answerHG === testWordHG) {
        this.toggleWrongAnswerMessage('EN');
      } else if (ansEN === testWordEN && this.answerHG !== testWordHG) {
        this.toggleWrongAnswerMessage('HG');
      } else {
        this.toggleWrongAnswerMessage('BOTH');
      }
      console.log('WRONG!!!!');
    }

    this.answerEN = '';
    this.answerHG = '';
  }

  submitAnswer() {
    this.onKeydown();
  }

  nextWord(isCorrect) {
    if (isCorrect == 0) {
      var unansweredVocabSet = JSON.parse(localStorage.getItem('unanswered-vocabulary'));

      if (unansweredVocabSet == null) {
        unansweredVocabSet = [];
      }

      if (!unansweredVocabSet.includes(this.guessWord)) {
        unansweredVocabSet.push(this.guessWord);
      }

      localStorage.setItem('unanswered-vocabulary', JSON.stringify(unansweredVocabSet));
    }

    this.guessWordSet = this.getNextWordSet();
    this.guessWord = this.getVocabularyJP(this.guessWordSet);
  }

  getVocabularyEN(wordSet: any[]) {
    return wordSet[EN_INDEX];
  }

  getVocabularyHG(wordSet: any[]) {
    return wordSet[HIRAGANA_INDEX];
  }

  getVocabularyJP(wordSet: any[]) {
    var jpWord = wordSet[KANJI_INDEX];

    if (jpWord.trim().length === 0) {
      jpWord = wordSet[HIRAGANA_INDEX];
    }

    return jpWord;
  }

  getNextWordSet() {
    var vocabSet = JSON.parse(localStorage.getItem('vocabulary-source'));
    var displayWord = vocabSet[this.guessWordIndex];

    if ((vocabSet.length - 1) > this.guessWordIndex) {
      this.guessWordIndex++;
    } else {
      var unansweredVocabSet = JSON.parse(localStorage.getItem('unanswered-vocabulary'));

      if (unansweredVocabSet.length > 0) {
        console.log('unanswered: ' + unansweredVocabSet);
        localStorage.setItem('vocabulary-source', JSON.stringify(unansweredVocabSet));
        this.guessWordIndex = 0;
      } else {
        // no wrong answers Yey!
        console.log('You got a perfect score!');
        this.toggleCongratzMessage();
      }
    }

    return displayWord;
  }

  toggleCorrectAnswerMessage() {
    this.showSucces = true;
    this.showError = false;
    this.showCongratz = false;
  }

  toggleCongratzMessage() {
    this.showSucces = false;
    this.showError = false;
    this.showCongratz = true;
  }

  toggleWrongAnswerMessage(lang) {
    if (lang == 'EN') {
      this.errorMessage = 'Incorrect EN.';
    } else if (lang == 'HG') {
      this.errorMessage = 'Incorrect HG.';
    } else {
      this.errorMessage = 'Both answers are incorrect :(';
    }

    this.showSucces = false;
    this.showError = true;
    this.showCongratz = false;
  }

  toggleTestMode(mode) {
    if (mode === TEST_MODE_EN_TO_JP) {
      this.testMode = "EN to JP";
    } else if (mode === TEST_MODE_JP_TO_EN) {
      this.testMode = "JP to EN";
    }
  }

  toggleTestSet(setKey) {
    console.log("selected set: " + setKey);
    this.testSet = 'Set ' + setKey;
    localStorage.setItem('active-set', setKey);

    this.resetVocabularyBySetKey(setKey);
  }

  resetVocabularyBySetKey(setKey) {
    var vocabularySetMap = new Map(JSON.parse(localStorage.getItem('vocabulary-set-map')));

    console.log('resetVocabularyBySetKey vocabularySetMap');
    console.log(vocabularySetMap);

    this.guessWordIndex = 0;

    this.vocabSource = Array.from(Object.keys(vocabularySetMap.get(setKey)), k=>vocabularySetMap.get(setKey)[k]);
    //this.vocabSource = vocabularySetMap.get(setKey);

    console.log('new vocabsource:');
    console.log(this.vocabSource);

    localStorage.setItem('vocabulary-source', JSON.stringify(this.shuffle(this.vocabSource)));
    localStorage.setItem('unanswered-vocabulary', JSON.stringify([]));

    this.correctAnswersCount = 0;
    this.totalItems =
    this.totalItems = this.vocabSource.length;
    this.answerEN = '';
    this.answerHG = '';
    this.showSucces = false;
    this.showError = false;
    this.showCongratz = false;

    this.nextWord(0);
  }

  // -> Fisher–Yates shuffle algorithm
  shuffle(array) {
    var m = array.length, t, i;

    // While there remain elements to shuffle
    while (m) {
      // Pick a remaining element…
      i = Math.floor(Math.random() * m--);

      // And swap it with the current element.
      t = array[m];
      array[m] = array[i];
      array[i] = t;
    }

    return array;
  }

}
