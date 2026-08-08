Component({
  properties: {
    active: {
      type: String,
      value: 'home',
    },
  },

  methods: {
    handleNavigate(event: WechatMiniprogram.BaseEvent) {
      const target = event.currentTarget.dataset['target'] as string | undefined
      if (!target || target === this.data.active) {
        return
      }
      const url = target === 'profile' ? '/pages/profile/index' : '/pages/home/index'
      void wx.reLaunch({ url })
    },
  },
})
