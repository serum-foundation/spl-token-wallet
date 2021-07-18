window.sollet = {
  postMessage: (message) => {
    const listener = (event) => {
      if (event.detail.id === message.id) {
        window.removeEventListener('sollet_contentscript_message', listener);
        window.postMessage(event.detail);
      }
    };
    window.addEventListener('sollet_contentscript_message', listener);

    window.dispatchEvent(
      new CustomEvent('sollet_injected_script_message', { detail: message }),
    );
  },
};
