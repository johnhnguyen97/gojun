/// <reference types="vite/client" />

declare module 'compromise' {
  interface Term {
    text: string;
    tags: string[];
  }

  interface Document {
    terms(): {
      json(): Term[];
    };
  }

  function nlp(text: string): Document;
  export default nlp;
}

declare module 'unofficial-jisho-api' {
  interface JapaneseEntry {
    word?: string;
    reading: string;
  }

  interface Sense {
    parts_of_speech: string[];
    english_definitions: string[];
  }

  interface JishoResult {
    japanese: JapaneseEntry[];
    senses: Sense[];
  }

  interface SearchResult {
    data: JishoResult[];
  }

  class JishoAPI {
    searchForPhrase(phrase: string): Promise<SearchResult>;
  }

  export = JishoAPI;
}
