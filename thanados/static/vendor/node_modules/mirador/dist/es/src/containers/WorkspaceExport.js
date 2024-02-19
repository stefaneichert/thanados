import { compose } from 'redux';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import { withTranslation } from 'react-i18next';
import { withPlugins } from '../extend/withPlugins';
import { WorkspaceExport } from '../components/WorkspaceExport';
import { getExportableState } from '../state/selectors';
/**
 * mapStateToProps - to hook up connect
 * @memberof Workspace
 * @private
 */

var mapStateToProps = function mapStateToProps(state) {
  return {
    exportableState: getExportableState(state)
  };
};
/**
 * Styles for the withStyles HOC
 */


var styles = function styles(theme) {
  return {
    accordionTitle: {
      padding: 0
    }
  };
};

var enhance = compose(withTranslation(), withStyles(styles), connect(mapStateToProps, {}), withPlugins('WorkspaceExport'));
export default enhance(WorkspaceExport);