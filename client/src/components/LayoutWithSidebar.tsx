import React from "react"
import Layout from "./Layout"

interface Props {
  sidebar: React.ReactNode
  content: React.ReactNode
}

const LayoutWithSidebar = (props: Props): JSX.Element => {
  const { sidebar, content } = props
  return (
    <Layout>
      <div className="row">
        <div id="sidebar" className="col-md-3 d-none d-md-block text-left">
          {sidebar}
        </div>
        <div id="content-panel" className="col-md-9 ml-sm-auto col-lg-9 px-4">
          {content}
        </div>
      </div>
    </Layout>
  )
}

export default LayoutWithSidebar
